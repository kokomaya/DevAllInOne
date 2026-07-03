import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export class HttpClientPanel {
    private panel: vscode.WebviewPanel | undefined;

    constructor(private context: vscode.ExtensionContext) {}

    show(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'httpClient',
            'HTTP Client',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        this.panel.webview.html = this.getHtml();

        this.panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendRequest') {
                try {
                    const result = await this.sendRequest(message.data);
                    this.panel?.webview.postMessage({ command: 'response', data: result });
                } catch (err: any) {
                    this.panel?.webview.postMessage({ command: 'response', data: { error: err.message, status: 0, statusText: 'Error', headers: {}, body: '', time: 0 } });
                }
            }
        });

        this.panel.onDidDispose(() => { this.panel = undefined; });
    }

    private sendRequest(data: { method: string; url: string; headers: Record<string, string>; body: string }): Promise<any> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let parsedUrl: URL;
            try {
                parsedUrl = new URL(data.url);
            } catch {
                reject(new Error('Invalid URL'));
                return;
            }

            const isHttps = parsedUrl.protocol === 'https:';
            const lib = isHttps ? https : http;

            const options: http.RequestOptions = {
                method: data.method,
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                headers: data.headers,
                timeout: 30000
            };

            const req = lib.request(options, (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf-8');
                    resolve({
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        headers: res.headers,
                        body,
                        time: Date.now() - startTime
                    });
                });
            });

            req.on('error', (err) => reject(err));
            req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

            if (data.body && ['POST', 'PUT', 'PATCH'].includes(data.method)) {
                req.write(data.body);
            }
            req.end();
        });
    }

    private getHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HTTP Client</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    .row { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
    select, input, textarea, button { font-family: inherit; font-size: 13px; padding: 6px 10px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; }
    select { width: 100px; }
    input[type="text"] { flex: 1; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; padding: 6px 16px; font-weight: bold; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    textarea { width: 100%; height: 120px; resize: vertical; font-family: monospace; }
    .tabs { display: flex; gap: 0; margin-bottom: 8px; border-bottom: 1px solid var(--vscode-input-border); }
    .tab { padding: 6px 16px; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { border-bottom-color: var(--vscode-focusBorder); font-weight: bold; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .response-header { margin: 16px 0 8px; font-weight: bold; }
    .status { padding: 4px 8px; border-radius: 3px; font-weight: bold; }
    .status.ok { background: #2d5; color: #000; }
    .status.err { background: #d44; color: #fff; }
    pre { background: var(--vscode-textBlockQuote-background); padding: 12px; border-radius: 4px; overflow: auto; max-height: 400px; white-space: pre-wrap; word-break: break-all; font-size: 12px; }
    .meta { font-size: 12px; color: var(--vscode-descriptionForeground); margin-left: 12px; }
    h3 { margin: 12px 0 6px; }
</style>
</head>
<body>
<div class="row">
    <select id="method">
        <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option><option>HEAD</option><option>OPTIONS</option>
    </select>
    <input type="text" id="url" placeholder="https://api.example.com/endpoint" />
    <button id="sendBtn">Send</button>
</div>

<div class="tabs">
    <div class="tab active" data-tab="headers">Headers</div>
    <div class="tab" data-tab="body">Body</div>
</div>
<div class="tab-content active" id="tab-headers">
    <textarea id="headers" placeholder='{"Content-Type": "application/json"}'>{}</textarea>
</div>
<div class="tab-content" id="tab-body">
    <textarea id="body" placeholder='{"key": "value"}'></textarea>
</div>

<div id="response" style="display:none;">
    <div class="response-header">
        Response <span id="resStatus" class="status"></span><span id="resTime" class="meta"></span>
    </div>
    <h3>Headers</h3>
    <pre id="resHeaders"></pre>
    <h3>Body</h3>
    <pre id="resBody"></pre>
</div>

<script>
const vscode = acquireVsCodeApi();
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

document.getElementById('sendBtn').addEventListener('click', () => {
    const method = document.getElementById('method').value;
    const url = document.getElementById('url').value;
    let headers = {};
    try { headers = JSON.parse(document.getElementById('headers').value || '{}'); } catch(e) {}
    const body = document.getElementById('body').value;
    document.getElementById('sendBtn').textContent = 'Sending...';
    vscode.postMessage({ command: 'sendRequest', data: { method, url, headers, body } });
});

window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.command === 'response') {
        const d = msg.data;
        document.getElementById('sendBtn').textContent = 'Send';
        document.getElementById('response').style.display = 'block';
        const statusEl = document.getElementById('resStatus');
        statusEl.textContent = d.status + ' ' + (d.statusText || '');
        statusEl.className = 'status ' + (d.status >= 200 && d.status < 400 ? 'ok' : 'err');
        document.getElementById('resTime').textContent = d.time + 'ms';
        document.getElementById('resHeaders').textContent = JSON.stringify(d.headers, null, 2);
        let body = d.body || d.error || '';
        try { body = JSON.stringify(JSON.parse(body), null, 2); } catch(e) {}
        document.getElementById('resBody').textContent = body;
    }
});
</script>
</body>
</html>`;
    }
}
