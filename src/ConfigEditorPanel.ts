import * as vscode from 'vscode';

export interface ConfigActionForm {
    key: string;
    type: string;      // CMD | TERM | URL | DOC | DIR
    command: string;
    argument: string;
    reserved1: string;
    reserved2: string;
}

export interface ConfigEditorOptions {
    mode: 'add' | 'edit';
    /** Human-readable location shown in the header (e.g. parent group path). */
    location?: string;
    initial?: Partial<ConfigActionForm>;
}

/**
 * A small webview form to create/edit a single action entry, replacing the
 * hand-written `TYPE|R1|R2|COMMAND|ARG` string protocol.
 */
export class ConfigEditorPanel {
    static show(
        context: vscode.ExtensionContext,
        options: ConfigEditorOptions,
        onSubmit: (form: ConfigActionForm) => void
    ): void {
        const panel = vscode.window.createWebviewPanel(
            'devAllInOneConfigEditor',
            options.mode === 'add' ? 'DevAllInOne: Add Action' : 'DevAllInOne: Edit Action',
            vscode.ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        panel.webview.html = ConfigEditorPanel.getHtml(options);

        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'submit') {
                const form = message.data as ConfigActionForm;
                onSubmit(form);
                panel.dispose();
            } else if (message.command === 'cancel') {
                panel.dispose();
            }
        }, undefined, context.subscriptions);
    }

    private static getHtml(options: ConfigEditorOptions): string {
        const init = options.initial || {};
        const esc = (s: string | undefined) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const types = ['CMD', 'TERM', 'KEY', 'URL', 'DOC', 'DIR'];
        const typeOptions = types.map(t => `<option value="${t}" ${init.type === t ? 'selected' : ''}>${t}</option>`).join('');
        const location = esc(options.location || '(root)');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Config Editor</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    h2 { margin: 0 0 4px; font-size: 16px; }
    .loc { color: var(--vscode-descriptionForeground); font-size: 12px; margin-bottom: 16px; }
    label { display: block; margin: 12px 0 4px; font-size: 12px; font-weight: bold; }
    input, select { width: 100%; padding: 7px 10px; font-size: 13px; font-family: inherit; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; }
    .hint { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 3px; }
    .row { display: flex; gap: 12px; }
    .row > div { flex: 1; }
    .preview { margin-top: 16px; padding: 10px 12px; background: var(--vscode-textBlockQuote-background); border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; }
    .preview .k { color: var(--vscode-descriptionForeground); }
    .actions { margin-top: 20px; display: flex; gap: 8px; }
    button { padding: 7px 18px; font-size: 13px; font-weight: bold; border: none; border-radius: 3px; cursor: pointer; }
    .primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .primary:hover { background: var(--vscode-button-hoverBackground); }
    .secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .err { color: var(--vscode-errorForeground); font-size: 12px; margin-top: 8px; min-height: 16px; }
</style>
</head>
<body>
<h2>${options.mode === 'add' ? 'Add Action' : 'Edit Action'}</h2>
<div class="loc">Location: ${location}</div>

<label>Name</label>
<input type="text" id="key" value="${esc(init.key)}" placeholder="e.g. build" ${options.mode === 'edit' ? 'readonly' : ''} />
<div class="hint">${options.mode === 'edit' ? 'Name is read-only when editing (use Rename to change it)' : 'Label shown in the tree; must be unique among siblings'}</div>

<div class="row">
    <div>
        <label>Type</label>
        <select id="type">${typeOptions}</select>
        <div class="hint">CMD=command · TERM=terminal · KEY=VS Code command/shortcut · URL=web · DOC=document · DIR=folder</div>
    </div>
    <div>
        <label>Reserved1</label>
        <input type="text" id="reserved1" value="${esc(init.reserved1)}" placeholder="optional / DIRECT" />
        <div class="hint">CMD: set DIRECT to send to terminal</div>
    </div>
</div>

<label>Command / Path / URL / Command ID</label>
<input type="text" id="command" value="${esc(init.command)}" placeholder="e.g. ./build.bat, https://..., ./docs/x.pdf, or workbench.action.files.save" />
<div class="hint">Supports the \${rootPath} variable. For KEY, enter a VS Code command id.</div>

<label>Arguments</label>
<input type="text" id="argument" value="${esc(init.argument)}" placeholder="optional, e.g. --cd=\${rootPath} (KEY: JSON args)" />

<label>Reserved2</label>
<input type="text" id="reserved2" value="${esc(init.reserved2)}" placeholder="optional" />

<div class="preview">
    <span class="k">Generated protocol string:</span><br><span id="preview"></span>
</div>
<div class="err" id="err"></div>

<div class="actions">
    <button class="primary" id="saveBtn">Save</button>
    <button class="secondary" id="cancelBtn">Cancel</button>
</div>

<script>
const vscode = acquireVsCodeApi();
const $ = (id) => document.getElementById(id);
const fields = ['key', 'type', 'command', 'argument', 'reserved1', 'reserved2'];

function collect() {
    return {
        key: $('key').value.trim(),
        type: $('type').value,
        command: $('command').value.trim(),
        argument: $('argument').value.trim(),
        reserved1: $('reserved1').value.trim(),
        reserved2: $('reserved2').value.trim()
    };
}

function updatePreview() {
    const f = collect();
    $('preview').textContent = [f.type, f.reserved1, f.reserved2, f.command, f.argument].join('|');
}

fields.forEach(id => $(id).addEventListener('input', updatePreview));
updatePreview();

$('saveBtn').addEventListener('click', () => {
    const f = collect();
    if (!f.key) { $('err').textContent = 'Name cannot be empty'; return; }
    if (!f.command) { $('err').textContent = 'Command / Path / URL cannot be empty'; return; }
    $('err').textContent = '';
    vscode.postMessage({ command: 'submit', data: f });
});
$('cancelBtn').addEventListener('click', () => vscode.postMessage({ command: 'cancel' }));
</script>
</body>
</html>`;
    }
}
