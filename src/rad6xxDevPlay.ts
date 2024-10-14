import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { stringify } from 'querystring';

export class DevPlayer implements vscode.TreeDataProvider<PlayerItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<PlayerItem | undefined | void> = new vscode.EventEmitter<PlayerItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<PlayerItem | undefined | void> = this._onDidChangeTreeData.event;
	private pathToItemMap: Map<string|null, PlayerItem|undefined> = new Map();
	private AlljsonData;  // debug
	constructor(private workspaceRoot: string | undefined) {
		if(workspaceRoot){
			const jsonFilePath = path.join(workspaceRoot, './conf/config.json');
			if (this.pathExists(jsonFilePath)) {
				this.AlljsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
				this.initPathFromJson(this.AlljsonData, "");
			}

		}

	}
	
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: PlayerItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: PlayerItem): Thenable<PlayerItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No dependency in empty workspace');
			return Promise.resolve([]);
		}
		const packageJsonPath = path.join(this.workspaceRoot, './conf/config.json');
		if (element) {
			return Promise.resolve(this.getItemsInJson(packageJsonPath, element));
		} else {
			
			if (this.pathExists(packageJsonPath)) {
				return Promise.resolve(this.getItemsInJson(packageJsonPath, element));
			} else {
				vscode.window.showInformationMessage('Workspace has no package.json');
				return Promise.resolve([]);
			}
		}

	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	// private getDepsInPackageJson(packageJsonPath: string): PlayerItem[] {
	// 	const workspaceRoot = this.workspaceRoot;
	// 	if (this.pathExists(packageJsonPath) && workspaceRoot) {
	// 		const jsonData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

	// 		// const toDep = (moduleName: string, version: string): PlayerItem => {
	// 		// 	if (this.pathExists(path.join(workspaceRoot, 'node_modules', moduleName))) {
	// 		// 		return new PlayerItem(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
	// 		// 	} else {
	// 		// 		return new PlayerItem(moduleName, version, vscode.TreeItemCollapsibleState.None, {
	// 		// 			command: 'extension.justBeatIt',
	// 		// 			title: '',
	// 		// 			arguments: [moduleName]
	// 		// 		});
	// 		// 	}
	// 		// };
    //         // const toItem = (key: string, value: string): PlayerItem => {
    //         //     return new PlayerItem(key, value, vscode.TreeItemCollapsibleState.None, {command: 'extension.justBeatIt',title: '',arguments: [key]});
    //         // };

    //         // const items = [];
    //         // for (const section in jsonData) {
    //         //         for (const key in jsonData[section]) {
    //         //                 items.push(toItem(key, jsonData[section][key]));
    //         //         }
                
    //         // }
    //         // return items;
	// 	// 	const topView = jsonData
	// 	// 	? Object.keys(jsonData).map(dep => toItem(dep, jsonData[dep]))
	// 	// 	: [];

	// 	// 	const deps = jsonData.dependencies
	// 	// 		? Object.keys(jsonData.dependencies).map(dep => toItem(dep, jsonData.dependencies[dep]))
	// 	// 		: [];
	// 	// 	const devDeps = jsonData.devDependencies
	// 	// 		? Object.keys(jsonData.devDependencies).map(dep => toItem(dep, jsonData.devDependencies[dep]))
	// 	// 		: [];
	// 	// 	const ib = jsonData.integrationBuild
	// 	// 	? Object.keys(jsonData.integrationBuild).map(dep => toItem(dep, jsonData.integrationBuild[dep]))
	// 	// 	: [];
	// 	// 	let treeViewItem = deps.concat(devDeps);

	// 	// 	treeViewItem = treeViewItem.concat(ib);
	// 	// 	return topView;
	// 	// } else {
	// 		return new Object[];
	// 	}
	// }
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
		
		if (this.pathExists(jsonFilePath)) {
			const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
			
			const toItem = (key: string, value: any): PlayerItem => {
					if(element){
						//const children = Object.keys(value).map(k => toItem(k, value[k]));
						//childrens = Object.keys(children).map(key => toItem(key, children[key]));
						const current = this.getValueByPath(jsonData, element.fullpath?.toString() + '/' + key.toString());
						if(this.hasNoChildItems(current)){
							return new PlayerItem(key, '', vscode.TreeItemCollapsibleState.Collapsed, element.fullpath?.toString() + '/' + key.toString());
						}else{
							if(JSON.stringify(value) === '{}'){
								return new PlayerItem('null', '', vscode.TreeItemCollapsibleState.Collapsed);
							}
							const parsedCommand = this.parseCommandString(value);
							return new PlayerItem(key, '', vscode.TreeItemCollapsibleState.None, element.fullpath?.toString() + '/' + key.toString(), 
							{command: 'extension.justBeatIt',title: '',arguments: [parsedCommand.command, parsedCommand.type]});
						}
					
					}
					else{
						return new PlayerItem(key, value, vscode.TreeItemCollapsibleState.Collapsed, key.toString());
					}

            };

	
			if(element?.fullpath){
				const subJson = this.getValueByPath(jsonData, element?.fullpath);
				if(subJson){
					const children = Object.keys(subJson).map(key => toItem(key, subJson[key]));
					return children;
				}	

			}else{
				const children =  Object.keys(jsonData).map(key => toItem(key, jsonData[key]));
				return children;
			}

			return [];
		} else {
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
			
			console.log(obj[section], typeof obj[section]);
			if(this.hasNoChildItems(obj[section])){
				this.initPathFromJson(obj[section], itemPath);
			}
		}
	}

	private hasNoChildItems(obj: any): boolean {
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
	private parseCommandString(commandString: string): ParsedCommand {
		const parts = commandString.split('|');
		return {
			type: parts[0],
			reserved1: parts[1],
			reserved2: parts[2],
			command: parts[3],
			arguments: parts[4]
		};
	}
	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
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
    arguments: string|undefined;
}



