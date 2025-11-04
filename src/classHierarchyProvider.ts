import * as vscode from 'vscode';
import { PythonParser, ClassInfo } from './pythonParser';

export class ClassHierarchyProvider {
    private decorationType: vscode.TextEditorDecorationType;
    private parser: PythonParser;
    private context: vscode.ExtensionContext;

    constructor(parser: PythonParser, context: vscode.ExtensionContext) {
        this.parser = parser;
        this.context = context;

        // Create decoration type for gutter icons
        this.decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: this.getIconPath('override'),
            gutterIconSize: 'contain'
        });
    }

    private getIconPath(iconName: string): vscode.Uri {
        // We'll use built-in codicons
        return vscode.Uri.parse(`data:image/svg+xml,${encodeURIComponent(this.getSvgIcon(iconName))}`);
    }

    private getSvgIcon(iconName: string): string {
        if (iconName === 'override') {
            // Arrow pointing up (method overrides parent)
            return `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#4CAF50">
                <path d="M8 3l4 4H9v6H7V7H4l4-4z"/>
            </svg>`;
        } else if (iconName === 'implemented') {
            // Arrow pointing down (method has implementations)
            return `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#2196F3">
                <path d="M8 13l-4-4h3V3h2v6h3l-4 4z"/>
            </svg>`;
        } else if (iconName === 'both') {
            // Double arrow (method both overrides and is implemented)
            return `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#9C27B0">
                <path d="M8 3l3 3H9v4h2l-3 3-3-3h2V6H5l3-3z"/>
            </svg>`;
        }
        return '';
    }

    /**
     * Update decorations for the current editor
     */
    public async updateDecorations(editor: vscode.TextEditor) {
        if (!editor || editor.document.languageId !== 'python') {
            return;
        }

        const document = editor.document;
        const classes = this.parser.parseDocument(document);

        // Clear existing decorations
        editor.setDecorations(this.decorationType, []);

        // Create new decorations
        const overrideDecorations: vscode.DecorationOptions[] = [];
        const implementedDecorations: vscode.DecorationOptions[] = [];
        const bothDecorations: vscode.DecorationOptions[] = [];

        for (const classInfo of classes) {
            // Check class line for inheritance
            if (classInfo.superclasses.length > 0) {
                const decoration = this.createDecoration(
                    document,
                    classInfo.startLine,
                    'override',
                    `Go to parent class: ${classInfo.superclasses.join(', ')}`
                );
                overrideDecorations.push(decoration);
            }

            // Check if class has subclasses
            const subclasses = await this.parser.findSubclasses(classInfo.name);
            if (subclasses.size > 0 && classInfo.superclasses.length === 0) {
                const subclassNames = Array.from(subclasses.values())
                    .flat()
                    .map(c => c.name)
                    .join(', ');
                const decoration = this.createDecoration(
                    document,
                    classInfo.startLine,
                    'implemented',
                    `Go to subclasses: ${subclassNames}`
                );
                implementedDecorations.push(decoration);
            } else if (subclasses.size > 0 && classInfo.superclasses.length > 0) {
                const subclassNames = Array.from(subclasses.values())
                    .flat()
                    .map(c => c.name)
                    .join(', ');
                const decoration = this.createDecoration(
                    document,
                    classInfo.startLine,
                    'both',
                    `Parent: ${classInfo.superclasses.join(', ')} | Subclasses: ${subclassNames}`
                );
                bothDecorations.push(decoration);
            }

            // Check methods
            for (const method of classInfo.methods) {
                const isOverriding = await this.parser.isMethodOverriding(classInfo, method.name);
                const implementations = await this.parser.findMethodImplementations(classInfo.name, method.name);

                if (isOverriding && implementations.length > 0) {
                    const decoration = this.createDecoration(
                        document,
                        method.line,
                        'both',
                        `Overrides parent method | ${implementations.length} implementation(s)`
                    );
                    bothDecorations.push(decoration);
                } else if (isOverriding) {
                    const decoration = this.createDecoration(
                        document,
                        method.line,
                        'override',
                        'Overrides parent method'
                    );
                    overrideDecorations.push(decoration);
                } else if (implementations.length > 0) {
                    const decoration = this.createDecoration(
                        document,
                        method.line,
                        'implemented',
                        `${implementations.length} implementation(s) in subclasses`
                    );
                    implementedDecorations.push(decoration);
                }
            }
        }

        // Apply decorations
        this.applyDecorations(editor, overrideDecorations, implementedDecorations, bothDecorations);
    }

    private createDecoration(
        document: vscode.TextDocument,
        line: number,
        iconType: string,
        hoverMessage: string
    ): vscode.DecorationOptions {
        const range = new vscode.Range(line, 0, line, 0);
        return {
            range,
            hoverMessage,
            renderOptions: {
                before: {
                    contentIconPath: this.getIconPath(iconType)
                }
            }
        };
    }

    private applyDecorations(
        editor: vscode.TextEditor,
        overrideDecorations: vscode.DecorationOptions[],
        implementedDecorations: vscode.DecorationOptions[],
        bothDecorations: vscode.DecorationOptions[]
    ) {
        // Create separate decoration types for each icon type
        const overrideDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: this.getIconPath('override'),
            gutterIconSize: 'contain'
        });

        const implementedDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: this.getIconPath('implemented'),
            gutterIconSize: 'contain'
        });

        const bothDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: this.getIconPath('both'),
            gutterIconSize: 'contain'
        });

        editor.setDecorations(overrideDecorationType, overrideDecorations);
        editor.setDecorations(implementedDecorationType, implementedDecorations);
        editor.setDecorations(bothDecorationType, bothDecorations);
    }

    /**
     * Navigate to implementations of a class or method
     */
    public async navigateToImplementations(document: vscode.TextDocument, line: number) {
        const classes = this.parser.parseDocument(document);

        // Find the class or method at the given line
        for (const classInfo of classes) {
            if (classInfo.startLine === line) {
                // Navigate to subclasses
                await this.showSubclasses(classInfo.name);
                return;
            }

            for (const method of classInfo.methods) {
                if (method.line === line) {
                    // Navigate to method implementations
                    await this.showMethodImplementations(classInfo.name, method.name);
                    return;
                }
            }
        }

        vscode.window.showInformationMessage('No implementations found');
    }

    /**
     * Navigate to superclass
     */
    public async navigateToSuperclass(document: vscode.TextDocument, line: number) {
        const classes = this.parser.parseDocument(document);

        // Find the class or method at the given line
        for (const classInfo of classes) {
            if (classInfo.startLine === line) {
                // Navigate to parent class
                if (classInfo.superclasses.length > 0) {
                    await this.showParentClasses(classInfo.superclasses);
                }
                return;
            }

            for (const method of classInfo.methods) {
                if (method.line === line) {
                    // Navigate to parent method
                    await this.showParentMethod(classInfo, method.name);
                    return;
                }
            }
        }

        vscode.window.showInformationMessage('No parent class found');
    }

    private async showSubclasses(className: string) {
        const subclasses = await this.parser.findSubclasses(className);

        if (subclasses.size === 0) {
            vscode.window.showInformationMessage('No subclasses found');
            return;
        }

        const items: vscode.QuickPickItem[] = [];
        for (const [filePath, classes] of subclasses) {
            for (const cls of classes) {
                items.push({
                    label: cls.name,
                    description: filePath,
                    detail: `Line ${cls.startLine + 1}`
                });
            }
        }

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a subclass to navigate to'
        });

        if (selected && selected.description) {
            const document = await vscode.workspace.openTextDocument(selected.description);
            const editor = await vscode.window.showTextDocument(document);
            const lineNumber = parseInt(selected.detail?.replace('Line ', '') || '1') - 1;
            const position = new vscode.Position(lineNumber, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    }

    private async showMethodImplementations(className: string, methodName: string) {
        const implementations = await this.parser.findMethodImplementations(className, methodName);

        if (implementations.length === 0) {
            vscode.window.showInformationMessage('No implementations found');
            return;
        }

        const items: vscode.QuickPickItem[] = implementations.map(impl => ({
            label: `${impl.className}.${methodName}`,
            description: impl.document.uri.fsPath,
            detail: `Line ${impl.line + 1}`
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an implementation to navigate to'
        });

        if (selected && selected.description) {
            const document = await vscode.workspace.openTextDocument(selected.description);
            const editor = await vscode.window.showTextDocument(document);
            const lineNumber = parseInt(selected.detail?.replace('Line ', '') || '1') - 1;
            const position = new vscode.Position(lineNumber, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    }

    private async showParentClasses(superclasses: string[]) {
        const items: vscode.QuickPickItem[] = [];

        for (const superclass of superclasses) {
            const parent = await this.parser.findParentClass(superclass);
            if (parent) {
                items.push({
                    label: parent.classInfo.name,
                    description: parent.document.uri.fsPath,
                    detail: `Line ${parent.classInfo.startLine + 1}`
                });
            }
        }

        if (items.length === 0) {
            vscode.window.showInformationMessage('Parent class not found in workspace');
            return;
        }

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a parent class to navigate to'
        });

        if (selected && selected.description) {
            const document = await vscode.workspace.openTextDocument(selected.description);
            const editor = await vscode.window.showTextDocument(document);
            const lineNumber = parseInt(selected.detail?.replace('Line ', '') || '1') - 1;
            const position = new vscode.Position(lineNumber, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    }

    private async showParentMethod(classInfo: ClassInfo, methodName: string) {
        for (const superclass of classInfo.superclasses) {
            const parent = await this.parser.findParentClass(superclass);
            if (parent) {
                const method = parent.classInfo.methods.find(m => m.name === methodName);
                if (method) {
                    const editor = await vscode.window.showTextDocument(parent.document);
                    const position = new vscode.Position(method.line, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                    return;
                }
            }
        }

        vscode.window.showInformationMessage('Parent method not found');
    }
}
