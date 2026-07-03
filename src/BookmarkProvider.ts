import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Bookmark {
    id: string;
    label: string;
    file: string;
    line: number;
    column: number;
    createdAt: string;
}

interface BookmarkData {
    bookmarks: Bookmark[];
}

export class BookmarkProvider implements vscode.TreeDataProvider<BookmarkItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BookmarkItem | undefined | void> = new vscode.EventEmitter<BookmarkItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<BookmarkItem | undefined | void> = this._onDidChangeTreeData.event;

    private bookmarks: Bookmark[] = [];
    private bookmarkFilePath: string;
    private decorationType: vscode.TextEditorDecorationType;

    constructor(private workspaceRoot: string) {
        this.bookmarkFilePath = path.join(workspaceRoot, '.vscode', 'bookmarks.json');
        this.decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: path.join(__dirname, '..', 'resources', 'light', 'bookmark.svg'),
            gutterIconSize: '80%'
        });
        this.loadBookmarks();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
        this.updateDecorations();
    }

    getTreeItem(element: BookmarkItem): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<BookmarkItem[]> {
        const items = this.bookmarks.map(b => {
            const relativePath = path.relative(this.workspaceRoot, b.file);
            const description = `${relativePath}:${b.line + 1}`;
            return new BookmarkItem(
                b.label || `Line ${b.line + 1}`,
                description,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'DevAllInOne.gotoBookmark',
                    title: 'Go to Bookmark',
                    arguments: [b]
                }
            );
        });
        return Promise.resolve(items);
    }

    addBookmark(editor: vscode.TextEditor, label?: string): void {
        const position = editor.selection.active;
        const filePath = editor.document.uri.fsPath;
        const lineText = editor.document.lineAt(position.line).text.trim();

        const bookmark: Bookmark = {
            id: this.generateId(),
            label: label || lineText.substring(0, 50) || `Line ${position.line + 1}`,
            file: filePath,
            line: position.line,
            column: position.character,
            createdAt: new Date().toISOString()
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        this.refresh();
    }

    removeBookmark(bookmark: Bookmark): void {
        this.bookmarks = this.bookmarks.filter(b => b.id !== bookmark.id);
        this.saveBookmarks();
        this.refresh();
    }

    removeBookmarkByItem(item: BookmarkItem): void {
        const index = this.bookmarks.findIndex(b => {
            const relativePath = path.relative(this.workspaceRoot, b.file);
            return item.description === `${relativePath}:${b.line + 1}`;
        });
        if (index >= 0) {
            this.bookmarks.splice(index, 1);
            this.saveBookmarks();
            this.refresh();
        }
    }

    gotoBookmark(bookmark: Bookmark): void {
        const fileUri = vscode.Uri.file(bookmark.file);
        vscode.window.showTextDocument(fileUri).then(editor => {
            const position = new vscode.Position(bookmark.line, bookmark.column);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        });
    }

    updateDecorations(): void {
        for (const editor of vscode.window.visibleTextEditors) {
            const fileBookmarks = this.bookmarks.filter(b => b.file === editor.document.uri.fsPath);
            const decorations: vscode.DecorationOptions[] = fileBookmarks.map(b => {
                const range = new vscode.Range(b.line, 0, b.line, 0);
                return { range, hoverMessage: `📌 ${b.label}` };
            });
            editor.setDecorations(this.decorationType, decorations);
        }
    }

    private loadBookmarks(): void {
        try {
            if (fs.existsSync(this.bookmarkFilePath)) {
                const data: BookmarkData = JSON.parse(fs.readFileSync(this.bookmarkFilePath, 'utf-8'));
                this.bookmarks = data.bookmarks || [];
            }
        } catch {
            this.bookmarks = [];
        }
    }

    private saveBookmarks(): void {
        const dir = path.dirname(this.bookmarkFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const data: BookmarkData = { bookmarks: this.bookmarks };
        fs.writeFileSync(this.bookmarkFilePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

export class BookmarkItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label} - ${this.description}`;
        this.contextValue = 'bookmark';
    }
}
