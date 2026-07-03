import * as vscode from 'vscode';
import * as fs from 'fs';

export function getWebviewContent_env(): string {
    const envVars = process.env;
    const rows = Object.keys(envVars)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .map(key => {
            const value = envVars[key] || '';
            const escapedKey = escapeHtml(key);
            const escapedValue = escapeHtml(value);
            // For PATH-like variables, split by separator
            const isPath = key.toUpperCase() === 'PATH' || key.toUpperCase().endsWith('_PATH') || key.toUpperCase() === 'PATHEXT';
            let displayValue = escapedValue;
            if (isPath && value.includes(';')) {
                const parts = value.split(';').filter(p => p.trim());
                displayValue = parts.map(p => {
                    const exists = checkPathExists(p.trim());
                    const cls = exists ? 'path-ok' : 'path-missing';
                    return `<span class="${cls}">${escapeHtml(p)}</span>`;
                }).join('<br>');
            }
            return `<tr data-key="${escapedKey.toLowerCase()}" data-value="${escapedValue.toLowerCase()}"><td class="key">${escapedKey}</td><td class="value">${displayValue}</td></tr>`;
        }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Environment Variables</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: var(--vscode-font-family, monospace); padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    input { width: 100%; padding: 8px 12px; margin-bottom: 12px; font-size: 14px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--vscode-input-border); vertical-align: top; }
    th { position: sticky; top: 0; background: var(--vscode-editor-background); font-weight: bold; }
    .key { font-weight: bold; white-space: nowrap; min-width: 180px; cursor: pointer; }
    .key:hover { text-decoration: underline; }
    .value { word-break: break-all; }
    .path-ok { color: var(--vscode-terminal-ansiGreen, #2d5); }
    .path-missing { color: var(--vscode-terminal-ansiRed, #d44); text-decoration: line-through; }
    .count { font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
    .hidden { display: none; }
</style>
</head>
<body>
<input type="text" id="search" placeholder="Search environment variables..." autofocus />
<div class="count" id="count">${Object.keys(envVars).length} variables</div>
<table>
<thead><tr><th>Name</th><th>Value</th></tr></thead>
<tbody id="tbody">
${rows}
</tbody>
</table>
<script>
const search = document.getElementById('search');
const tbody = document.getElementById('tbody');
const countEl = document.getElementById('count');
const allRows = tbody.querySelectorAll('tr');
search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    let visible = 0;
    allRows.forEach(row => {
        const match = row.dataset.key.includes(q) || row.dataset.value.includes(q);
        row.classList.toggle('hidden', !match);
        if (match) visible++;
    });
    countEl.textContent = visible + ' / ' + allRows.length + ' variables';
});
// Click to copy
tbody.addEventListener('click', (e) => {
    const td = e.target.closest('td');
    if (td) {
        const text = td.textContent;
        navigator.clipboard.writeText(text).then(() => {
            td.style.outline = '1px solid var(--vscode-focusBorder)';
            setTimeout(() => td.style.outline = '', 500);
        });
    }
});
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function checkPathExists(p: string): boolean {
    try {
        fs.accessSync(p);
        return true;
    } catch {
        return false;
    }
}
