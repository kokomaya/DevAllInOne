import * as vscode from 'vscode';
import { FlatAction } from './DevAllInOne';

export interface DashboardData {
    all: FlatAction[];
    favorites: FlatAction[];
    recent: FlatAction[];
}

/**
 * Quick-access Dashboard: favorites, recent, and all actions in one place.
 * Click to run; star to (un)favorite. Stays live via getData re-render.
 */
export class DashboardPanel {
    private static panel: vscode.WebviewPanel | undefined;

    static show(
        context: vscode.ExtensionContext,
        getData: () => DashboardData,
        onRun: (fullpath: string) => void,
        onToggleFav: (fullpath: string) => void
    ): void {
        if (DashboardPanel.panel) {
            DashboardPanel.panel.reveal(vscode.ViewColumn.Active);
            DashboardPanel.post(getData());
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            'devAllInOneDashboard',
            'DevAllInOne: Quick Access',
            vscode.ViewColumn.Active,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        DashboardPanel.panel = panel;
        panel.webview.html = DashboardPanel.getHtml();
        panel.webview.onDidReceiveMessage((msg) => {
            if (msg.command === 'run') {
                onRun(msg.fullpath);
            } else if (msg.command === 'toggleFav') {
                onToggleFav(msg.fullpath);
                DashboardPanel.post(getData());
            } else if (msg.command === 'ready') {
                DashboardPanel.post(getData());
            }
        }, undefined, context.subscriptions);
        panel.onDidDispose(() => { DashboardPanel.panel = undefined; });
    }

    private static post(data: DashboardData): void {
        const favSet = new Set(data.favorites.map(f => f.fullpath));
        const map = (a: FlatAction) => ({
            label: a.label,
            pathLabel: a.pathLabel,
            fullpath: a.fullpath,
            type: a.type,
            fav: favSet.has(a.fullpath)
        });
        DashboardPanel.panel?.webview.postMessage({
            command: 'state',
            favorites: data.favorites.map(map),
            recent: data.recent.map(map),
            all: data.all.map(map)
        });
    }

    private static getHtml(): string {
        return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }
    h2 { font-size: 14px; margin: 18px 0 8px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px; }
    h2:first-child { margin-top: 0; }
    input { width: 100%; padding: 8px 12px; margin-bottom: 8px; font-size: 13px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 4px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
    .card { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; cursor: pointer; background: var(--vscode-editorWidget-background); }
    .card:hover { background: var(--vscode-list-hoverBackground); }
    .card .icon { font-size: 14px; opacity: 0.8; }
    .card .body { flex: 1; min-width: 0; }
    .card .name { font-weight: bold; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card .path { font-size: 11px; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .star { cursor: pointer; font-size: 14px; opacity: 0.5; }
    .star.on { opacity: 1; color: var(--vscode-charts-yellow, #e5c07b); }
    .star:hover { opacity: 1; }
    .kbd { font-size: 10px; color: var(--vscode-descriptionForeground); border: 1px solid var(--vscode-panel-border); border-radius: 3px; padding: 0 4px; margin-left: 4px; }
    .empty { color: var(--vscode-descriptionForeground); font-size: 12px; padding: 4px 0; }
</style>
</head>
<body>
<input type="text" id="search" placeholder="Search actions…" autofocus />
<div id="favSection"><h2>★ Favorites (Alt+1~9)</h2><div class="grid" id="favGrid"></div></div>
<div id="recentSection"><h2>🕘 Recent</h2><div class="grid" id="recentGrid"></div></div>
<div><h2>All Actions</h2><div class="grid" id="allGrid"></div></div>
<script>
const vscode = acquireVsCodeApi();
let data = { favorites: [], recent: [], all: [] };
const q = document.getElementById('search');

function iconFor(t) {
    return t === 'URL' ? '🌐' : t === 'DIR' ? '📁' : t === 'DOC' ? '📄' : t === 'TERM' ? '⌨️' : t === 'CMD' ? '⚙️' : '▶️';
}
function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function card(a, index) {
    const div = document.createElement('div');
    div.className = 'card';
    const kbd = (index !== undefined && index < 9) ? '<span class="kbd">Alt+' + (index + 1) + '</span>' : '';
    div.innerHTML =
        '<span class="icon">' + iconFor(a.type) + '</span>' +
        '<div class="body"><div class="name">' + esc(a.label) + kbd + '</div><div class="path">' + esc(a.pathLabel) + '</div></div>' +
        '<span class="star ' + (a.fav ? 'on' : '') + '" title="Favorite">★</span>';
    div.querySelector('.body').addEventListener('click', () => vscode.postMessage({ command: 'run', fullpath: a.fullpath }));
    div.querySelector('.icon').addEventListener('click', () => vscode.postMessage({ command: 'run', fullpath: a.fullpath }));
    div.querySelector('.star').addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ command: 'toggleFav', fullpath: a.fullpath }); });
    return div;
}

function render() {
    const term = q.value.toLowerCase();
    const match = (a) => !term || a.label.toLowerCase().includes(term) || a.pathLabel.toLowerCase().includes(term);
    const favGrid = document.getElementById('favGrid');
    const recentGrid = document.getElementById('recentGrid');
    const allGrid = document.getElementById('allGrid');
    favGrid.innerHTML = ''; recentGrid.innerHTML = ''; allGrid.innerHTML = '';

    const favs = data.favorites.filter(match);
    favs.forEach((a, i) => favGrid.appendChild(card(a, i)));
    if (!favs.length) favGrid.innerHTML = '<div class="empty">No favorites yet. Click the ★ on the right to add.</div>';

    const recents = data.recent.filter(match);
    recents.forEach(a => recentGrid.appendChild(card(a)));
    document.getElementById('recentSection').style.display = recents.length ? '' : 'none';

    data.all.filter(match).forEach(a => allGrid.appendChild(card(a)));
}

q.addEventListener('input', render);
window.addEventListener('message', (e) => {
    if (e.data.command === 'state') {
        data = { favorites: e.data.favorites, recent: e.data.recent, all: e.data.all };
        render();
    }
});
vscode.postMessage({ command: 'ready' });
</script>
</body>
</html>`;
    }
}
