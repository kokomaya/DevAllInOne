import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { pathExists } from './utilities';
import { stringify } from 'querystring';
import merge from 'deepmerge';

export class DevPlayer implements vscode.TreeDataProvider<PlayerItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<PlayerItem | undefined | void> = new vscode.EventEmitter<PlayerItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<PlayerItem | undefined | void> = this._onDidChangeTreeData.event;
	private pathToItemMap: Map<string|null, PlayerItem|undefined> = new Map();
	private AlljsonData:any;  // debug
	private localJsonData:any;  // debug
	private settingPath: string | undefined;
	private mergeFlag: boolean | undefined;
	constructor(private workspaceRoot: string | undefined, settingPath:string|undefined, mergeFlag:boolean|undefined) {
		this.settingPath = settingPath;
		this.mergeFlag = mergeFlag;
		this.loadConfig();
	}

	/**
	 * Load (or reload) all config json files from disk and rebuild the path map.
	 * Extracted so that `reload()` can refresh data without reloading the window.
	 */
	private loadConfig(): void {
		let jsonFileCollector:string[] = [];
		this.AlljsonData = {};
		this.localJsonData = {};
		this.pathToItemMap = new Map();

		if(this.workspaceRoot){
			const jsonFilePath = path.join(this.workspaceRoot, './conf/config.json');
			const localJsonFilePath = path.join(this.workspaceRoot, './conf/config_local.json');

			if (pathExists(jsonFilePath)) {
				this.AlljsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
			}
			else{
				this.AlljsonData = {};
			}
			if (pathExists(localJsonFilePath)) {
				this.localJsonData = JSON.parse(fs.readFileSync(localJsonFilePath, 'utf-8'));
			}
			else{
				this.localJsonData = {};
			}

			// If local and global json file both exsit, merge them together
			if(this.AlljsonData || this.localJsonData){
				this.AlljsonData = merge(this.AlljsonData, this.localJsonData);
			}
		}

		if(this.settingPath){
			const pathArray = this.settingPath.split(';').map(path => path.trim());
			jsonFileCollector = jsonFileCollector.concat(pathArray);

			jsonFileCollector.forEach((json)=>{
				if(pathExists(json) && this.mergeFlag){
					const settingJson = JSON.parse(fs.readFileSync(json, 'utf-8'));
					this.AlljsonData = merge(this.AlljsonData, settingJson);
				}
				else{
					vscode.window.showInformationMessage("Cann't find:" + json);
				}
			});
		}

		//Init json item path
		this.initPathFromJson(this.AlljsonData, "");
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	/**
	 * Re-read config files from disk and refresh the tree in place (no window reload).
	 */
	reload(): void {
		try {
			this.loadConfig();
		} catch (err: any) {
			vscode.window.showErrorMessage(`DevAllInOne: failed to reload config - ${err?.message ?? err}`);
		}
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PlayerItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: PlayerItem): Thenable<PlayerItem[]> {
		if (!this.workspaceRoot) {
			//vscode.window.showInformationMessage('No dependency in empty workspace');
			return Promise.resolve([]);
		}
		const packageJsonPath = ""; // intentionally assignment
		return Promise.resolve(this.getItemsInJson(packageJsonPath, element));

	}


	private getValueByPath(json: any, path: string): any {
		const keys = path.split('/');
		let current = json;
	
		for (const key of keys) {
			if (current && typeof current === 'object' && key in current) {
				current = current[key];
			} else {
				return undefined; // Return undefined if the path is invalid
			}
		}
	
		return current;
	}


	private getItemsInJson(jsonFilePath: string, element?:PlayerItem): PlayerItem[] {
		
		if(this.AlljsonData){
			const toItem = (key: string, value: any): PlayerItem => {
				if(element){
					//const children = Object.keys(value).map(k => toItem(k, value[k]));
					//childrens = Object.keys(children).map(key => toItem(key, children[key]));
					const current = this.getValueByPath(this.AlljsonData, element.fullpath?.toString() + '/' + key.toString());
					if(this.hasChildItems(current)){
						return new PlayerItem(key, '', vscode.TreeItemCollapsibleState.Collapsed, element.fullpath?.toString() + '/' + key.toString());
					}else{
						if(JSON.stringify(value) === '{}'){
							return new PlayerItem('null', '', vscode.TreeItemCollapsibleState.Collapsed);
						}
						const parsedCommand = this.parseCommandString(value);
						return new PlayerItem(key, '', vscode.TreeItemCollapsibleState.None, element.fullpath?.toString() + '/' + key.toString(), 
						{command: 'extension.justBeatIt',title: '',arguments: [parsedCommand.command, parsedCommand.type, parsedCommand.argument,parsedCommand.reserved1]});
					}
				
				}
				else{
					return new PlayerItem(key, value, vscode.TreeItemCollapsibleState.Collapsed, key.toString());
				}

			};

			if(element?.fullpath){
				const subJson = this.getValueByPath(this.AlljsonData, element?.fullpath);
				if(subJson){
					const children = Object.keys(subJson).map(key => toItem(key, subJson[key]));
					return children;
				}	

			}else{
				const children =  Object.keys(this.AlljsonData).map(key => toItem(key, this.AlljsonData[key]));
				return children;
			}

			return [];
		}
		else{
			return [];
		}
	}

	private initPathFromJson(obj: any, path:string){

		if(typeof obj === 'string'){
			return;
		}
		for (const section in obj) {
			const itemPath = path + "/" + section.toString();
			if(!this.pathToItemMap.has(itemPath)){
				this.pathToItemMap.set(itemPath, undefined);
			}
			
			//console.log(obj[section], typeof obj[section]);
			if(this.hasChildItems(obj[section])){
				this.initPathFromJson(obj[section], itemPath);
			}
		}
	}

	private hasChildItems(obj: any): boolean {
		if(obj){
			if(typeof obj === 'string'){
				return false;
			}
			//console.log(Object.keys(obj).length.toString(), obj);
			return Object.keys(obj).length !== 0;
		}
		else{
			return false;
		}
	}

	/**
	 * Flatten all leaf (runnable) actions from the merged config into a list,
	 * used by the dynamic command palette for fuzzy search.
	 */
	getFlatActions(): FlatAction[] {
		const actions: FlatAction[] = [];
		const walk = (obj: any, trail: string[]) => {
			if (!obj || typeof obj !== 'object') {
				return;
			}
			for (const key of Object.keys(obj)) {
				const value = obj[key];
				const nextTrail = [...trail, key];
				if (typeof value === 'string') {
					const parsed = this.parseCommandString(value);
					actions.push({
						label: key,
						pathLabel: nextTrail.join(' / '),
						type: parsed.type,
						command: parsed.command,
						argument: parsed.argument,
						reserved1: parsed.reserved1
					});
				} else if (this.hasChildItems(value)) {
					walk(value, nextTrail);
				}
			}
		};
		walk(this.AlljsonData, []);
		return actions;
	}

	private parseCommandString(commandString: string): ParsedCommand {
		const parts = commandString.split('|');
		return {
			type: parts[0],
			reserved1: parts[1],
			reserved2: parts[2],
			command: parts[3],
			argument: parts[4]
		};
	}

	// ---------------------------------------------------------------------
	// Config CRUD (writes back to conf/config.json, then reloads the tree)
	// ---------------------------------------------------------------------

	/** Path of the primary editable config file (conf/config.json). */
	getPrimaryConfigPath(): string | undefined {
		if (!this.workspaceRoot) {
			return undefined;
		}
		return path.join(this.workspaceRoot, './conf/config.json');
	}

	private readPrimaryConfig(): any {
		const p = this.getPrimaryConfigPath();
		if (p && pathExists(p)) {
			return JSON.parse(fs.readFileSync(p, 'utf-8'));
		}
		return {};
	}

	private writePrimaryConfig(data: any): void {
		const p = this.getPrimaryConfigPath();
		if (!p) {
			throw new Error('No workspace folder opened');
		}
		const dir = path.dirname(p);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(p, JSON.stringify(data, null, '\t'), 'utf-8');
	}

	/** Resolve the container object for a '/'-separated node path inside config.json. */
	private resolveContainer(root: any, nodePath: string | undefined): { container: any; key: string } | undefined {
		if (!nodePath) {
			return undefined;
		}
		const keys = nodePath.split('/').filter(k => k.length > 0);
		if (keys.length === 0) {
			return undefined;
		}
		let current = root;
		for (let i = 0; i < keys.length - 1; i++) {
			if (current && typeof current === 'object' && keys[i] in current) {
				current = current[keys[i]];
			} else {
				return undefined;
			}
		}
		return { container: current, key: keys[keys.length - 1] };
	}

	/**
	 * Add a child under parentPath (undefined = root). value is a raw action
	 * string (leaf) or an object (group). Returns false if key already exists.
	 */
	addNode(parentPath: string | undefined, key: string, value: string | object): boolean {
		const root = this.readPrimaryConfig();
		let container = root;
		if (parentPath) {
			const keys = parentPath.split('/').filter(k => k.length > 0);
			for (const k of keys) {
				if (typeof container[k] !== 'object' || container[k] === null) {
					container[k] = {};
				}
				container = container[k];
			}
		}
		if (key in container) {
			return false;
		}
		container[key] = value;
		this.writePrimaryConfig(root);
		this.reload();
		return true;
	}

	/** Update a leaf action's value (raw string). */
	updateLeaf(nodePath: string, value: string): boolean {
		const root = this.readPrimaryConfig();
		const resolved = this.resolveContainer(root, nodePath);
		if (!resolved || !(resolved.key in resolved.container)) {
			return false;
		}
		resolved.container[resolved.key] = value;
		this.writePrimaryConfig(root);
		this.reload();
		return true;
	}

	/** Rename a node's key while keeping its value/children. */
	renameNode(nodePath: string, newKey: string): boolean {
		const root = this.readPrimaryConfig();
		const resolved = this.resolveContainer(root, nodePath);
		if (!resolved || !(resolved.key in resolved.container)) {
			return false;
		}
		if (newKey in resolved.container && newKey !== resolved.key) {
			return false;
		}
		const value = resolved.container[resolved.key];
		// Rebuild to preserve key order roughly (delete + set).
		delete resolved.container[resolved.key];
		resolved.container[newKey] = value;
		this.writePrimaryConfig(root);
		this.reload();
		return true;
	}

	/** Delete a node (leaf or group) from config.json. */
	deleteNode(nodePath: string): boolean {
		const root = this.readPrimaryConfig();
		const resolved = this.resolveContainer(root, nodePath);
		if (!resolved || !(resolved.key in resolved.container)) {
			return false;
		}
		delete resolved.container[resolved.key];
		this.writePrimaryConfig(root);
		this.reload();
		return true;
	}

	/** Read the raw string value of a leaf node from the merged config. */
	getRawValue(nodePath: string): string | undefined {
		const resolved = this.resolveContainer(this.AlljsonData, nodePath);
		if (resolved && typeof resolved.container[resolved.key] === 'string') {
			return resolved.container[resolved.key];
		}
		return undefined;
	}

	/** True if the node exists in the primary editable config.json. */
	existsInPrimary(nodePath: string): boolean {
		const root = this.readPrimaryConfig();
		const resolved = this.resolveContainer(root, nodePath);
		return !!resolved && resolved.key in resolved.container;
	}
}

export class PlayerItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly fullpath?: string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
		this.fullpath = fullpath;
		// Distinguish groups (expandable) from runnable actions (leaf) for menus.
		this.contextValue = collapsibleState === vscode.TreeItemCollapsibleState.None ? 'action' : 'group';
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';
}


interface ParsedCommand {
    type: string|undefined;
    reserved1: string|undefined;
    reserved2: string|undefined;
    command: string;
    argument: string|undefined;
}

export interface FlatAction {
    label: string;
    pathLabel: string;
    type: string | undefined;
    command: string;
    argument: string | undefined;
    reserved1: string | undefined;
}



