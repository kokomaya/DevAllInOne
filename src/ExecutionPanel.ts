import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';

type RunStatus = 'running' | 'success' | 'failed' | 'stopped';

interface RunRecord {
    id: string;
    label: string;
    commandLine: string;
    cwd: string | undefined;
    status: RunStatus;
    startTime: number;
    endTime?: number;
    exitCode?: number | null;
    logs: string[];
}

/**
 * Execution Center: runs commands with captured stdout/stderr, tracks status
 * (running / success / failed / stopped), duration and exit code, and streams
 * logs into a webview panel. Supports stop and rerun.
 */
export class ExecutionCenter {
    private static _instance: ExecutionCenter | undefined;
    static instance(context: vscode.ExtensionContext): ExecutionCenter {
        if (!ExecutionCenter._instance) {
            ExecutionCenter._instance = new ExecutionCenter(context);
        }
        return ExecutionCenter._instance;
    }

    private panel: vscode.WebviewPanel | undefined;
    private runs: RunRecord[] = [];
    private processes = new Map<string, ChildProcess>();

    private constructor(private context: vscode.ExtensionContext) {}

    show(): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Active);
            return;
        }
        this.panel = vscode.window.createWebviewPanel(
            'devAllInOneExecution',
            'DevAllInOne: 执行中心',
            vscode.ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        this.panel.webview.html = this.getHtml();
        this.panel.webview.onDidReceiveMessage((msg) => {
            if (msg.command === 'stop') {
                this.stop(msg.id);
            } else if (msg.command === 'rerun') {
                this.rerun(msg.id);
            } else if (msg.command === 'clear') {
                this.clearFinished();
            } else if (msg.command === 'ready') {
                this.postState();
            }
        }, undefined, this.context.subscriptions);
        this.panel.onDidDispose(() => { this.panel = undefined; });
        this.postState();
    }

    /** Start a new run; opens the panel if not visible. */
    run(label: string, commandLine: string, cwd: string | undefined): void {
        this.show();
        const record: RunRecord = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            label,
            commandLine,
            cwd,
            status: 'running',
            startTime: Date.now(),
            logs: []
        };
        this.runs.unshift(record);
        this.postAddRun(record);
        this.spawnFor(record);
    }

    private spawnFor(record: RunRecord): void {
        let child: ChildProcess;
        try {
            child = spawn(record.commandLine, { cwd: record.cwd, shell: true, windowsHide: true });
        } catch (err: any) {
            this.appendLog(record, `[spawn error] ${err?.message ?? err}\n`);
            this.finish(record, 'failed', null);
            return;
        }
        this.processes.set(record.id, child);
        this.appendLog(record, `$ ${record.commandLine}\n`);

        child.stdout?.on('data', (data) => this.appendLog(record, data.toString()));
        child.stderr?.on('data', (data) => this.appendLog(record, data.toString()));
        child.on('error', (err) => this.appendLog(record, `[error] ${err.message}\n`));
        child.on('close', (code) => {
            this.processes.delete(record.id);
            if (record.status === 'stopped') {
                this.postUpdate(record);
                return;
            }
            this.finish(record, code === 0 ? 'success' : 'failed', code);
        });
    }

    private stop(id: string): void {
        const child = this.processes.get(id);
        const record = this.runs.find(r => r.id === id);
        if (child && record) {
            record.status = 'stopped';
            record.endTime = Date.now();
            this.appendLog(record, `\n[stopped by user]\n`);
            try { child.kill(); } catch { /* ignore */ }
            this.processes.delete(id);
            this.postUpdate(record);
        }
    }

    private rerun(id: string): void {
        const old = this.runs.find(r => r.id === id);
        if (old) {
            this.run(old.label, old.commandLine, old.cwd);
        }
    }

    private clearFinished(): void {
        this.runs = this.runs.filter(r => r.status === 'running');
        this.postState();
    }

    private finish(record: RunRecord, status: RunStatus, code: number | null): void {
        record.status = status;
        record.exitCode = code;
        record.endTime = Date.now();
        this.postUpdate(record);
    }

    private appendLog(record: RunRecord, text: string): void {
        record.logs.push(text);
        this.panel?.webview.postMessage({ command: 'log', id: record.id, text });
    }

    private postAddRun(record: RunRecord): void {
        this.panel?.webview.postMessage({ command: 'addRun', run: this.toDto(record) });
    }

    private postUpdate(record: RunRecord): void {
        this.panel?.webview.postMessage({ command: 'updateRun', run: this.toDto(record) });
    }

    private postState(): void {
        this.panel?.webview.postMessage({ command: 'state', runs: this.runs.map(r => this.toDto(r)) });
    }

    private toDto(r: RunRecord) {
        return {
            id: r.id,
            label: r.label,
            commandLine: r.commandLine,
            status: r.status,
            startTime: r.startTime,
            endTime: r.endTime,
            exitCode: r.exitCode,
            logs: r.logs.join('')
        };
    }

    private getHtml(): string {
        return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Execution Center</title>
<style>
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; }
    .toolbar { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; gap: 8px; }
    .toolbar h3 { margin: 0; font-size: 13px; flex: 1; }
    button { padding: 4px 12px; font-size: 12px; border: none; border-radius: 3px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .main { flex: 1; display: flex; min-height: 0; }
    .list { width: 300px; border-right: 1px solid var(--vscode-panel-border); overflow-y: auto; }
    .run { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); cursor: pointer; }
    .run:hover { background: var(--vscode-list-hoverBackground); }
    .run.active { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
    .run .name { font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .run .meta { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .running { background: #e5c07b; }
    .success { background: #98c379; }
    .failed { background: #e06c75; }
    .stopped { background: #888; }
    .detail { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .detail-bar { padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .detail-bar .cmd { flex: 1; font-family: monospace; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    pre { flex: 1; margin: 0; padding: 12px; overflow: auto; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; white-space: pre-wrap; word-break: break-all; background: var(--vscode-terminal-background, var(--vscode-editor-background)); }
    .empty { padding: 24px; color: var(--vscode-descriptionForeground); text-align: center; }
</style>
</head>
<body>
<div class="toolbar">
    <h3>执行中心</h3>
    <button id="clearBtn">清除已完成</button>
</div>
<div class="main">
    <div class="list" id="list"><div class="empty">暂无执行记录</div></div>
    <div class="detail">
        <div class="detail-bar">
            <span class="cmd" id="detailCmd"></span>
            <button id="stopBtn" style="display:none;">停止</button>
            <button id="rerunBtn" style="display:none;">重跑</button>
        </div>
        <pre id="log"></pre>
    </div>
</div>
<script>
const vscode = acquireVsCodeApi();
const runs = new Map();
let activeId = null;
const listEl = document.getElementById('list');
const logEl = document.getElementById('log');
const detailCmd = document.getElementById('detailCmd');
const stopBtn = document.getElementById('stopBtn');
const rerunBtn = document.getElementById('rerunBtn');

function fmtDuration(r) {
    const end = r.endTime || Date.now();
    const ms = end - r.startTime;
    return (ms / 1000).toFixed(1) + 's';
}
function statusText(r) {
    if (r.status === 'running') return '运行中 · ' + fmtDuration(r);
    if (r.status === 'success') return '成功 · ' + fmtDuration(r) + ' · exit ' + (r.exitCode ?? 0);
    if (r.status === 'failed') return '失败 · ' + fmtDuration(r) + ' · exit ' + (r.exitCode ?? '?');
    return '已停止 · ' + fmtDuration(r);
}
function renderList() {
    if (runs.size === 0) { listEl.innerHTML = '<div class="empty">暂无执行记录</div>'; return; }
    const arr = [...runs.values()].sort((a, b) => b.startTime - a.startTime);
    listEl.innerHTML = '';
    for (const r of arr) {
        const div = document.createElement('div');
        div.className = 'run' + (r.id === activeId ? ' active' : '');
        div.onclick = () => selectRun(r.id);
        div.innerHTML = '<div class="name"><span class="dot ' + r.status + '"></span>' + escapeHtml(r.label) + '</div><div class="meta">' + statusText(r) + '</div>';
        listEl.appendChild(div);
    }
}
function selectRun(id) {
    activeId = id;
    const r = runs.get(id);
    if (!r) return;
    detailCmd.textContent = r.commandLine;
    logEl.textContent = r.logs || '';
    logEl.scrollTop = logEl.scrollHeight;
    stopBtn.style.display = r.status === 'running' ? '' : 'none';
    rerunBtn.style.display = r.status === 'running' ? 'none' : '';
    renderList();
}
function escapeHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

stopBtn.onclick = () => activeId && vscode.postMessage({ command: 'stop', id: activeId });
rerunBtn.onclick = () => activeId && vscode.postMessage({ command: 'rerun', id: activeId });
document.getElementById('clearBtn').onclick = () => vscode.postMessage({ command: 'clear' });

window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.command === 'state') {
        runs.clear();
        for (const r of msg.runs) runs.set(r.id, r);
        if (!runs.has(activeId)) activeId = msg.runs[0]?.id ?? null;
        renderList();
        if (activeId) selectRun(activeId);
    } else if (msg.command === 'addRun') {
        runs.set(msg.run.id, msg.run);
        activeId = msg.run.id;
        selectRun(activeId);
    } else if (msg.command === 'updateRun') {
        const existing = runs.get(msg.run.id);
        if (existing) { msg.run.logs = existing.logs; runs.set(msg.run.id, msg.run); }
        else runs.set(msg.run.id, msg.run);
        if (msg.run.id === activeId) selectRun(activeId);
        else renderList();
    } else if (msg.command === 'log') {
        const r = runs.get(msg.id);
        if (r) {
            r.logs = (r.logs || '') + msg.text;
            if (msg.id === activeId) {
                const atBottom = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 20;
                logEl.textContent = r.logs;
                if (atBottom) logEl.scrollTop = logEl.scrollHeight;
            }
        }
    }
});
vscode.postMessage({ command: 'ready' });
setInterval(() => { if (activeId && runs.get(activeId)?.status === 'running') renderList(); }, 1000);
</script>
</body>
</html>`;
    }
}
