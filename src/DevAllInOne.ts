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
	private localJsonData;  // debug
	private workspace;
	private mergeFlag;
	constructor(private workspaceRoot: string | undefined, settingPath:string|undefined, mergeFlag:boolean|undefined) {
		let jsonFileCollector:string[] = [];
		if(workspaceRoot){
			const jsonFilePath = path.join(workspaceRoot, './conf/config.json');
			const localJsonFilePath = path.join(workspaceRoot, './conf/config_local.json');

			if (pathExists(jsonFilePath)) {
				this.AlljsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
				
			}
			if (pathExists(jsonFilePath)) {
				this.localJsonData = JSON.parse(fs.readFileSync(localJsonFilePath, 'utf-8'));
			}
			
			// If local and global json file both exsit, merge them together
			if(this.AlljsonData && this.localJsonData){
				this.AlljsonData = merge(this.AlljsonData, this.localJsonData);
			}

			this.workspace = workspaceRoot;
			this.mergeFlag = mergeFlag;
		}

		if(settingPath){
			const pathArray = settingPath.split(';').map(path => path.trim());
			jsonFileCollector = jsonFileCollector.concat(pathArray);

			jsonFileCollector.forEach((json)=>{
				if(pathExists(json) && mergeFlag){
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
    argument: string|undefined;
}



