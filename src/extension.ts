'use strict';

import * as vscode from 'vscode';
import * as path from 'path';  
import * as fs from 'fs';

import { JsonOutlineProvider } from './jsonOutline';
import { DevPlayer, PlayerItem } from './DevAllInOne';
import { pathExists } from './utilities';
import { exec } from 'child_process';
import { spawn,ChildProcessWithoutNullStreams } from 'child_process';
import { getWebviewContent_rex_lut,getWebviewContent_ascii_lut } from './StaticView';



export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	let disposable = vscode.commands.registerCommand('DevAllInOne.selectJsonFile', async () => {
		const options: vscode.OpenDialogOptions = {
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: true,
			openLabel: 'Select',
			filters: {
			'JSON files': ['json']
			}
		};
	
		const fileUri = await vscode.window.showOpenDialog(options);
		if (fileUri && fileUri.length > 0) {
			let selectedPath:string;
			selectedPath = fileUri[0].fsPath + '';
			for(let i = 1 ; i < fileUri.length; i++){
				selectedPath = selectedPath + ';' + fileUri[i].fsPath;
			}
			const config = vscode.workspace.getConfiguration();
			await config.update('DevAllInOne.jsonFilePath', selectedPath, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(`JSON file selected: ${selectedPath}`);
		}
		});
	    // 创建状态栏项
		const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		statusBarItem.text = "$(book)"; // 使用内置图标
		statusBarItem.tooltip = "DevAllInOne"; // 鼠标悬停时的提示
		statusBarItem.command = 'DevAllInOne.showMenu'; // 绑定命令
	
		statusBarItem.show();
	
		// 注册命令
		const showMenuCommand = vscode.commands.registerCommand('DevAllInOne.showMenu',  () => {
			showQuickPickMenu();
		});
	
	let disposable_rex_lut = vscode.commands.registerCommand('DevAllInOne.showRegexpLookupTable', () => {
		const panel = vscode.window.createWebviewPanel(
			'regexpLookupTable',
			'正则表达式查找表',
			vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
		);

		panel.webview.html = getWebviewContent_rex_lut();

		// 监听 Webview 的快捷键操作，触发 VSCode 查找框
		panel.webview.onDidReceiveMessage((message) => {
			if (message.command === 'triggerFind') {
				vscode.commands.executeCommand('actions.find');  // 触发 VSCode 的查找框
			}
		});
	});

	let disposable_ascii = vscode.commands.registerCommand('DevAllInOne.showAsciiLookupTable', () => {
		const panel = vscode.window.createWebviewPanel(
			'AsciiLookupTable',
			'ASCII码表',
			vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
		);

		panel.webview.html = getWebviewContent_ascii_lut();
	});


    

	

	if (rootPath !== undefined) {  
		const config = vscode.workspace.getConfiguration();
		const selectedPath = config.get<string>('DevAllInOne.jsonFilePath');
		const mergeSettingFlag = config.get<boolean>('DevAllInOne.jsonMerge');
		
		//console.log(`Selected JSON file path: ${selectedPath} ${mergeSettingFlag}`);
		//const workspaceName: string = path.basename(rootPath as string); 
		const jsonFilePath = path.join(rootPath, './conf/config.json');
		const localJsonFilePath = path.join(rootPath, './conf/config_local.json')
		vscode.commands.registerCommand('DevAllInOne.refreshEntry', () => vscode.commands.executeCommand('workbench.action.reloadWindow'));
		if (pathExists(jsonFilePath) || pathExists(localJsonFilePath) || mergeSettingFlag) {
			// Samples of `window.registerTreeDataProvider`
			const radPlayerInstance = new DevPlayer(rootPath, selectedPath, mergeSettingFlag);
			vscode.window.registerTreeDataProvider('DevAllInOne', radPlayerInstance);
			//vscode.commands.registerCommand('DevAllInOne.refreshEntry', () => radPlayerInstance.refresh());
			vscode.commands.registerCommand('extension.justBeatIt', (command,type, argument:string, reserved1:string|undefined,) => {
				const absolutePath = path.resolve(rootPath, command);

				let newargs = '';
				if(argument){
					newargs = argument.replace('${rootPath}', rootPath);
				}

				if(command){
					command = command.replace('${rootPath}', rootPath);
				}

				newargs = path.resolve(newargs);

				if(type){
					if(type === "CMD"){
						if(!reserved1){
							//Spawn a new PowerShell process
							const ps = spawn('powershell.exe', ['-NoExit', '-Command', `"& {Start-Process -FilePath '${absolutePath}' -ArgumentList '${newargs}'}"`], {
								shell: true
							});


							ps.stdout.on('data', (data) => {
								//console.log(`stdout: ${data}`);
							});

							ps.stderr.on('data', (data) => {
								//console.error(`stderr: ${data}`);
								vscode.window.showErrorMessage(`Stderr: ${data}`);
							});

							ps.on('close', (code) => {
								//console.log(`PowerShell process exited with code ${code}`);
							});
						}else if( reserved1 === "DIRECT"){
							vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: command + " " + newargs});
						}

					}else if(type === "URL"){
						vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(command));
					}else if(type === "DOC"){
						// Determine the command based on the platform
						const command = process.platform === 'win32' ? `start "" "${absolutePath}"` :
						process.platform === 'darwin' ? `open "${absolutePath}"` :
						`xdg-open "${absolutePath}"`;
		
						exec(command, (error, stdout, stderr) => {
							if (error) {
								vscode.window.showErrorMessage(`Error: ${error.message}`);
								return;
							}
							if (stderr) {
								vscode.window.showErrorMessage(`Stderr: ${stderr}`);
								return;
							}
							vscode.window.showInformationMessage(`Document opened successfully.`);
						});
					}else if(type === "DIR"){
						let dirCmd = ``;
						if (process.platform === 'win32') {
							dirCmd = `explorer ${absolutePath}`;
						} else if (process.platform === 'darwin') {
							dirCmd = `open ${absolutePath}`;
						} else if (process.platform === 'linux') {
							dirCmd = `xdg-open ${absolutePath}`;
						}
						// exec(dirCmd, (err) => {
						// 	if (err) {
						// 		vscode.window.showErrorMessage(`Failed to open folder: ${err.message}`);
						// 	}
						// });
						exec(`start "" "${absolutePath}"`, (error, stdout, stderr) => {
							if (error) {
							  //console.error(`Error opening folder: ${error.message}`);
							  vscode.window.showErrorMessage(`Failed to open folder: ${error}`);
							  return;
							}
							if (stderr) {
							  //console.error(`Error: ${stderr}`);
							  vscode.window.showErrorMessage(`Failed to open folder: ${stderr}`);
							  return;
							}
							//console.log(`Folder opened successfully: ${stdout}`);
						  });
					}
				}
			
			});
			vscode.commands.registerCommand('DevAllInOne.addEntry', () => vscode.window.showInformationMessage(`AddEntry feature is not suported yet!`));
			vscode.commands.registerCommand('DevAllInOne.editEntry', (node: PlayerItem) => vscode.window.showInformationMessage(`EditEntry feature is not suported yet!`));
			vscode.commands.registerCommand('DevAllInOne.deleteEntry', (node: PlayerItem) => vscode.window.showInformationMessage(`DeleteEntry feature is not suported yet!`));




			// const jsonOutlineProvider = new JsonOutlineProvider(context);
			// vscode.window.registerTreeDataProvider('jsonOutline', jsonOutlineProvider);
			// vscode.commands.registerCommand('jsonOutline.refresh', () => jsonOutlineProvider.refresh());
			// vscode.commands.registerCommand('jsonOutline.refreshNode', offset => jsonOutlineProvider.refresh(offset));
			// vscode.commands.registerCommand('jsonOutline.renameNode', args => {
			// 	let offset = undefined;
			// 	if (args.selectedTreeItems && args.selectedTreeItems.length) {
			// 		offset = args.selectedTreeItems[0];
			// 	} else if (typeof args === 'number') {
			// 		offset = args;
			// 	}
			// 	if (offset) {
			// 		jsonOutlineProvider.rename(offset);
			// 	}
			// });
			//vscode.commands.registerCommand('extension.openJsonSelection', range => jsonOutlineProvider.select(range));
		}
		else{
			vscode.window.showWarningMessage('No ./conf/config.json found\r\n, you could create a new ./conf/config.json or ask for it from integrator', 'Create a template')
			.then(selection => {
				if (selection === 'Create a template') {
					fs.writeFile(jsonFilePath, `{
	"integrationBuild": {
		"cmd_test": "CMD|||../../test.cmd",
		"check": {
			"Reset":"CMD||Reserved|../../reset.bat",
			"Stash":"CMD||Reserved|../../stash.bat",
			"None":"CMD||Reserved|../../none.bat"
		},
		"DevEnv_Git_Bash":"CMD|||git-bash.exe|--cd=./"
	},
	"quickAccess": {
		"GenData": "DIR|||./test/Data"
	},
	"pages": {
		"m365":{
			"home":"URL|||https://www.microsoft365.com"
		}
	},
	"docs": {
		"doc_test":{
			"excel":"DOC|||./test/test.xlsm",
			"pdf":"DOC|||./test//test.pdf"
		}
	}
}`, 
					(err) => {
						if (err) {
							vscode.window.showErrorMessage('Failed to create ' + './conf/config.json, make sure conf folder exsits');
						} else {
							vscode.window.showInformationMessage('./conf/config.json' + ' created successfully!');
							// refresh windows toload config.json
							vscode.commands.executeCommand('workbench.action.reloadWindow');
						}
					});
				}
			});
		}

	}else{
		vscode.window.showWarningMessage('You have to open a folder to activate DevAllInOne', 'Open Folder')
		.then(selection => {
			if (selection === 'Open Folder') {
				vscode.commands.executeCommand('vscode.openFolder');
			}
		});
	}

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable_rex_lut);
	context.subscriptions.push(disposable_ascii);
	context.subscriptions.push(statusBarItem, showMenuCommand);
	

}
async function showQuickPickMenu() {
    const items = [
        { label: '$(regex) 正则查询表', command: 'DevAllInOne.showRegexpLookupTable' },
        { label: '$(code) ASCII码表', command: 'DevAllInOne.showAsciiLookupTable' }
    ];

    const selected = await vscode.window.showQuickPick(items);
    selected && vscode.commands.executeCommand(selected.command);
}
export function deactivate() {}