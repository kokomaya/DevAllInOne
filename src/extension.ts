'use strict';

import * as vscode from 'vscode';
import * as path from 'path';  
import * as fs from 'fs';

import { JsonOutlineProvider } from './jsonOutline';
import { DevPlayer, PlayerItem, FlatAction } from './DevAllInOne';
import { BookmarkProvider } from './BookmarkProvider';
import { HttpClientPanel } from './HttpClientPanel';
import { getWebviewContent_env } from './EnvView';
import { ConfigEditorPanel } from './ConfigEditorPanel';
import { ExecutionCenter } from './ExecutionPanel';
import { pathExists } from './utilities';
import { exec } from 'child_process';
import { spawn,ChildProcessWithoutNullStreams } from 'child_process';
import { getWebviewContent_rex_lut,getWebviewContent_ascii_lut } from './StaticView';



export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Shared reference to the tree provider so the command palette can list config actions.
	let devPlayerRef: DevPlayer | undefined;

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
			showQuickPickMenu(context, () => devPlayerRef);
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

	// HTTP Client
	const httpClientPanel = new HttpClientPanel(context);
	let disposable_http = vscode.commands.registerCommand('DevAllInOne.showHttpClient', () => {
		httpClientPanel.show();
	});

	// Environment Variable Viewer
	let disposable_env = vscode.commands.registerCommand('DevAllInOne.showEnvVariables', () => {
		const panel = vscode.window.createWebviewPanel(
			'envVariables',
			'Environment Variables',
			vscode.ViewColumn.One,
			{ enableScripts: true, retainContextWhenHidden: true }
		);
		panel.webview.html = getWebviewContent_env();
	});

	// Execution Center (streaming logs, status, stop / rerun)
	let disposable_exec = vscode.commands.registerCommand('DevAllInOne.showExecutionCenter', () => {
		ExecutionCenter.instance(context).show();
	});

	// Bookmark Manager
	let bookmarkProvider: BookmarkProvider | undefined;
	if (rootPath) {
		bookmarkProvider = new BookmarkProvider(rootPath);
		vscode.window.registerTreeDataProvider('DevAllInOneBookmarks', bookmarkProvider);

		vscode.commands.registerCommand('DevAllInOne.addBookmark', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showWarningMessage('No active editor');
				return;
			}
			const label = await vscode.window.showInputBox({ prompt: 'Bookmark label (optional)', placeHolder: 'Enter a label or leave empty' });
			bookmarkProvider!.addBookmark(editor, label || undefined);
		});

		vscode.commands.registerCommand('DevAllInOne.removeBookmark', (item) => {
			bookmarkProvider!.removeBookmarkByItem(item);
		});

		vscode.commands.registerCommand('DevAllInOne.gotoBookmark', (bookmark) => {
			bookmarkProvider!.gotoBookmark(bookmark);
		});

		// Update decorations when editors change
		vscode.window.onDidChangeActiveTextEditor(() => bookmarkProvider?.updateDecorations());
		vscode.workspace.onDidOpenTextDocument(() => setTimeout(() => bookmarkProvider?.updateDecorations(), 100));
	}

	if (rootPath !== undefined) {  
		const config = vscode.workspace.getConfiguration();
		const selectedPath = config.get<string>('DevAllInOne.jsonFilePath');
		const mergeSettingFlag = config.get<boolean>('DevAllInOne.jsonMerge');
		
		//console.log(`Selected JSON file path: ${selectedPath} ${mergeSettingFlag}`);
		//const workspaceName: string = path.basename(rootPath as string); 
		const jsonFilePath = path.join(rootPath, './conf/config.json');
		const localJsonFilePath = path.join(rootPath, './conf/config_local.json')
		let radPlayerInstance: DevPlayer | undefined;
		// Refresh in place (reload config from disk) instead of reloading the whole window.
		vscode.commands.registerCommand('DevAllInOne.refreshEntry', () => {
			if (radPlayerInstance) {
				radPlayerInstance.reload();
				vscode.window.setStatusBarMessage('$(sync) DevAllInOne: config reloaded', 2000);
			} else {
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			}
		});
		if (pathExists(jsonFilePath) || pathExists(localJsonFilePath) || mergeSettingFlag) {
			// Samples of `window.registerTreeDataProvider`
			radPlayerInstance = new DevPlayer(rootPath, selectedPath, mergeSettingFlag);
			devPlayerRef = radPlayerInstance;
			vscode.window.registerTreeDataProvider('DevAllInOne', radPlayerInstance);

			// Watch config files so the tree auto-refreshes on external edits (no window reload).
			const confWatcher = vscode.workspace.createFileSystemWatcher('**/conf/config*.json');
			const autoReload = () => radPlayerInstance?.reload();
			confWatcher.onDidChange(autoReload);
			confWatcher.onDidCreate(autoReload);
			confWatcher.onDidDelete(autoReload);
			context.subscriptions.push(confWatcher);
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
					if(type === "TERM"){
						// Execute command in VS Code integrated terminal
						const terminalName = `DevAllInOne`;
						let terminal = vscode.window.terminals.find(t => t.name === terminalName);
						if (!terminal) {
							terminal = vscode.window.createTerminal({ name: terminalName, cwd: rootPath });
						}
						terminal.show();
						let termCmd = command;
						if (argument) {
							termCmd = command + ' ' + newargs;
						}
						terminal.sendText(termCmd);
					} else if(type === "CMD"){
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
			vscode.commands.registerCommand('DevAllInOne.addEntry', (node?: PlayerItem) => {
				const provider = radPlayerInstance;
				if (!provider) { return; }
				const parentPath = node?.fullpath;
				const location = parentPath ? parentPath.split('/').join(' / ') : undefined;
				ConfigEditorPanel.show(context, { mode: 'add', location }, (form) => {
					const value = `${form.type}|${form.reserved1}|${form.reserved2}|${form.command}|${form.argument}`;
					const ok = provider.addNode(parentPath, form.key, value);
					if (ok) {
						vscode.window.showInformationMessage(`已新增动作：${form.key}`);
					} else {
						vscode.window.showErrorMessage(`同级已存在名称 "${form.key}"，请换一个名称`);
					}
				});
			});
			vscode.commands.registerCommand('DevAllInOne.editEntry', (node: PlayerItem) => {
				const provider = radPlayerInstance;
				if (!provider || !node?.fullpath) { return; }
				const nodePath = node.fullpath;
				if (!provider.existsInPrimary(nodePath)) {
					vscode.window.showWarningMessage('该节点不在 conf/config.json 中（可能来自 config_local.json 或外部文件），暂不支持在此编辑。');
					return;
				}
				const raw = provider.getRawValue(nodePath);
				if (raw === undefined) {
					vscode.window.showWarningMessage('该节点是分组，暂不支持表单编辑；可使用重命名或在其下新增动作。');
					return;
				}
				const parts = raw.split('|');
				const keys = nodePath.split('/');
				const location = keys.slice(0, -1).join(' / ') || undefined;
				ConfigEditorPanel.show(context, {
					mode: 'edit',
					location,
					initial: {
						key: keys[keys.length - 1],
						type: parts[0], reserved1: parts[1], reserved2: parts[2],
						command: parts[3], argument: parts[4]
					}
				}, (form) => {
					const value = `${form.type}|${form.reserved1}|${form.reserved2}|${form.command}|${form.argument}`;
					const ok = provider.updateLeaf(nodePath, value);
					if (ok) {
						vscode.window.showInformationMessage(`已更新动作：${form.key}`);
					} else {
						vscode.window.showErrorMessage('更新失败，请检查节点是否仍存在。');
					}
				});
			});
			vscode.commands.registerCommand('DevAllInOne.deleteEntry', async (node: PlayerItem) => {
				const provider = radPlayerInstance;
				if (!provider || !node?.fullpath) { return; }
				const nodePath = node.fullpath;
				if (!provider.existsInPrimary(nodePath)) {
					vscode.window.showWarningMessage('该节点不在 conf/config.json 中，暂不支持删除。');
					return;
				}
				const confirm = await vscode.window.showWarningMessage(
					`确定删除 "${node.label}" 吗？此操作会写回 conf/config.json。`,
					{ modal: true }, '删除'
				);
				if (confirm === '删除') {
					const ok = provider.deleteNode(nodePath);
					if (ok) {
						vscode.window.showInformationMessage(`已删除：${node.label}`);
					} else {
						vscode.window.showErrorMessage('删除失败，请检查节点是否仍存在。');
					}
				}
			});
			vscode.commands.registerCommand('DevAllInOne.renameEntry', async (node: PlayerItem) => {
				const provider = radPlayerInstance;
				if (!provider || !node?.fullpath) { return; }
				const nodePath = node.fullpath;
				if (!provider.existsInPrimary(nodePath)) {
					vscode.window.showWarningMessage('该节点不在 conf/config.json 中，暂不支持重命名。');
					return;
				}
				const newName = await vscode.window.showInputBox({
					prompt: '输入新名称', value: String(node.label),
					validateInput: (v) => v.trim() ? undefined : '名称不能为空'
				});
				if (newName && newName.trim() && newName.trim() !== String(node.label)) {
					const ok = provider.renameNode(nodePath, newName.trim());
					if (ok) {
						vscode.window.showInformationMessage(`已重命名为：${newName.trim()}`);
					} else {
						vscode.window.showErrorMessage('重命名失败：同级可能已存在该名称。');
					}
				}
			});
			// Run an action's command in the Execution Center with streaming logs.
			vscode.commands.registerCommand('DevAllInOne.runWithLogs', (node: PlayerItem) => {
				const provider = radPlayerInstance;
				if (!provider || !node?.fullpath) { return; }
				const raw = provider.getRawValue(node.fullpath);
				if (raw === undefined) {
					vscode.window.showWarningMessage('分组节点不可执行，请选择具体动作。');
					return;
				}
				const parts = raw.split('|');
				const type = parts[0];
				let command = parts[3] || '';
				let argument = parts[4] || '';
				command = command.replace('${rootPath}', rootPath);
				argument = argument.replace('${rootPath}', rootPath);
				if (type !== 'CMD' && type !== 'TERM') {
					vscode.window.showWarningMessage(`类型 ${type} 暂不支持在执行中心运行（仅 CMD/TERM）。`);
					return;
				}
				const commandLine = argument ? `${command} ${argument}` : command;
				ExecutionCenter.instance(context).run(String(node.label), commandLine, rootPath);
			});




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
	context.subscriptions.push(disposable_http);
	context.subscriptions.push(disposable_env);
	context.subscriptions.push(disposable_exec);
	context.subscriptions.push(statusBarItem, showMenuCommand);
	

}
async function showQuickPickMenu(
	context: vscode.ExtensionContext,
	getProvider: () => DevPlayer | undefined
) {
	const RECENT_KEY = 'DevAllInOne.recentActions';
	const iconForType = (type: string | undefined): string => {
		switch (type) {
			case 'URL': return '$(globe)';
			case 'DIR': return '$(folder)';
			case 'DOC': return '$(file)';
			case 'CMD': return '$(terminal)';
			case 'TERM': return '$(terminal-cmd)';
			default: return '$(play)';
		}
	};

	// Built-in tools
	interface MenuItem extends vscode.QuickPickItem { run: () => void; recentId?: string; }
	const builtIn: MenuItem[] = [
		{ label: '$(regex) 正则查询表', run: () => vscode.commands.executeCommand('DevAllInOne.showRegexpLookupTable') },
		{ label: '$(code) ASCII码表', run: () => vscode.commands.executeCommand('DevAllInOne.showAsciiLookupTable') },
		{ label: '$(globe) HTTP Client', run: () => vscode.commands.executeCommand('DevAllInOne.showHttpClient') },
		{ label: '$(symbol-variable) 环境变量', run: () => vscode.commands.executeCommand('DevAllInOne.showEnvVariables') },
		{ label: '$(pulse) 执行中心', run: () => vscode.commands.executeCommand('DevAllInOne.showExecutionCenter') },
		{ label: '$(bookmark) 添加书签', run: () => vscode.commands.executeCommand('DevAllInOne.addBookmark') }
	];

	// Config actions (dynamic, fuzzy-searchable)
	const provider = getProvider();
	const actions: FlatAction[] = provider ? provider.getFlatActions() : [];
	const actionItems: MenuItem[] = actions.map(a => {
		const recentId = a.pathLabel;
		return {
			label: `${iconForType(a.type)} ${a.label}`,
			description: a.pathLabel,
			detail: a.command ? `${a.type ?? ''} ${a.command}${a.argument ? ' ' + a.argument : ''}`.trim() : undefined,
			recentId,
			run: () => vscode.commands.executeCommand('extension.justBeatIt', a.command, a.type, a.argument, a.reserved1)
		};
	});

	// Recent-used section (from globalState)
	const recentIds = context.globalState.get<string[]>(RECENT_KEY, []);
	const recentItems: MenuItem[] = [];
	for (const id of recentIds) {
		const found = actionItems.find(i => i.recentId === id);
		if (found) {
			recentItems.push({ ...found, description: `${found.description ?? ''}  ·  最近使用`.trim() });
		}
		if (recentItems.length >= 5) { break; }
	}

	const items: MenuItem[] = [];
	if (recentItems.length) {
		items.push({ label: '最近使用', kind: vscode.QuickPickItemKind.Separator, run: () => {} } as MenuItem);
		items.push(...recentItems);
	}
	items.push({ label: '工具', kind: vscode.QuickPickItemKind.Separator, run: () => {} } as MenuItem);
	items.push(...builtIn);
	if (actionItems.length) {
		items.push({ label: '配置动作', kind: vscode.QuickPickItemKind.Separator, run: () => {} } as MenuItem);
		items.push(...actionItems);
	}

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: '搜索并执行动作（工具 / 配置命令 / 最近使用）',
		matchOnDescription: true,
		matchOnDetail: true
	});
	if (!selected || !selected.run) {
		return;
	}
	// Record recent
	if (selected.recentId) {
		const next = [selected.recentId, ...recentIds.filter(id => id !== selected.recentId)].slice(0, 10);
		await context.globalState.update(RECENT_KEY, next);
	}
	selected.run();
}
export function deactivate() {}