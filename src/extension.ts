'use strict';

import * as vscode from 'vscode';
import * as path from 'path';  

import { JsonOutlineProvider } from './jsonOutline';
import { TestViewDragAndDrop } from './testViewDragAndDrop';
import { TestView } from './testView';
import { DevPlayer, PlayerItem } from './rad6xxDevPlay';
import { containsBothSubstrings } from './utilities';
import { exec } from 'child_process';
import { spawn } from 'child_process';



export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
	
	if (rootPath !== undefined) {  
		const workspaceName: string = path.basename(rootPath as string); 

		if(containsBothSubstrings(workspaceName, "RAD6XX", "IUC")){

			// Samples of `window.registerTreeDataProvider`
			const radPlayerInstance = new DevPlayer(rootPath);
			vscode.window.registerTreeDataProvider('rad6xxDevPlay', radPlayerInstance);
			vscode.commands.registerCommand('rad6xxDevPlay.refreshEntry', () => radPlayerInstance.refresh());
			vscode.commands.registerCommand('extension.justBeatIt', (command,type, argument, tooltip:string|undefined,) => {
				const absolutePath = path.resolve(rootPath, command);
				if(type){
					if(type === "CMD"){
						// exec(absolutePath, (error, stdout, stderr) => {
						// 	if (error) {
						// 		vscode.window.showErrorMessage(`Error: ${error.message}`);
						// 		return;
						// 	}
						// 	if (stderr) {
						// 		vscode.window.showErrorMessage(`Stderr: ${stderr}`);
						// 		return;
						// 	}
						// 	vscode.window.showInformationMessage(`Output: ${stdout}`);
						// });


						// const terminal = vscode.window.createTerminal('Run CMD File');
						// terminal.sendText(`"${absolutePath}"`);
						// terminal.show();

						// Spawn a new PowerShell process
						const ps = spawn('powershell.exe', ['-NoExit', '-Command', `"& {Start-Process -FilePath '${absolutePath}'}"`], {
							shell: true
						});

						ps.stdout.on('data', (data) => {
							console.log(`stdout: ${data}`);
						});

						ps.stderr.on('data', (data) => {
							console.error(`stderr: ${data}`);
						});

						ps.on('close', (code) => {
							console.log(`PowerShell process exited with code ${code}`);
						});
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
						exec(dirCmd, (err) => {
							if (err) {
								vscode.window.showErrorMessage(`Failed to open folder: ${err.message}`);
							}
						});
					}
				}
				
			});
			vscode.commands.registerCommand('rad6xxDevPlay.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
			vscode.commands.registerCommand('rad6xxDevPlay.editEntry', (node: PlayerItem) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
			vscode.commands.registerCommand('rad6xxDevPlay.deleteEntry', (node: PlayerItem) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));


			const jsonOutlineProvider = new JsonOutlineProvider(context);
			vscode.window.registerTreeDataProvider('jsonOutline', jsonOutlineProvider);
			vscode.commands.registerCommand('jsonOutline.refresh', () => jsonOutlineProvider.refresh());
			vscode.commands.registerCommand('jsonOutline.refreshNode', offset => jsonOutlineProvider.refresh(offset));
			vscode.commands.registerCommand('jsonOutline.renameNode', args => {
				let offset = undefined;
				if (args.selectedTreeItems && args.selectedTreeItems.length) {
					offset = args.selectedTreeItems[0];
				} else if (typeof args === 'number') {
					offset = args;
				}
				if (offset) {
					jsonOutlineProvider.rename(offset);
				}
			});
			vscode.commands.registerCommand('extension.openJsonSelection', range => jsonOutlineProvider.select(range));

		}else{
			vscode.window.showWarningMessage('rad6xx-devenv deactived due to current workspace is not IUC', 'Open Folder')
			.then(selection => {
				if (selection === 'Open Folder') {
					vscode.commands.executeCommand('vscode.openFolder');
				}
			});
		}
	}else{
		vscode.window.showWarningMessage('rad6xx-devenv deactived due to current workspace is not IUC', 'Open Folder')
		.then(selection => {
			if (selection === 'Open Folder') {
				vscode.commands.executeCommand('vscode.openFolder');
			}
		});
	}

}