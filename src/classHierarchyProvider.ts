import * as vscode from 'vscode';
import { PythonParser, ClassInfo } from './pythonParser';

export class ClassHierarchyProvider {
    private parser: PythonParser;
    private context: vscode.ExtensionContext;
    private isNavigating: boolean = false;

    constructor(parser: PythonParser, context: vscode.ExtensionContext) {
        this.parser = parser;
        this.context = context;
    }

    public isCurrentlyNavigating(): boolean {
        return this.isNavigating;
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

        // Create new decorations
        const overrideDecorations: vscode.DecorationOptions[] = [];
        const implementedDecorations: vscode.DecorationOptions[] = [];

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
            if (subclasses.size > 0) {
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
            }

            // Check methods
            for (const method of classInfo.methods) {
                const isOverriding = await this.parser.isMethodOverriding(classInfo, method.name);
                const implementations = await this.parser.findMethodImplementations(classInfo.name, method.name);

                if (isOverriding) {
                    const decoration = this.createDecoration(
                        document,
                        method.line,
                        'override',
                        'Overrides parent method'
                    );
                    overrideDecorations.push(decoration);
                }

                if (implementations.length > 0) {
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
        this.applyDecorations(editor, overrideDecorations, implementedDecorations);
    }

    private createDecoration(
        document: vscode.TextDocument,
        line: number,
        iconType: string,
        hoverMessage: string
    ): vscode.DecorationOptions {
        const range = new vscode.Range(line, 0, line, 0);

        // Get the appropriate icon symbol and color
        let iconSymbol = '';
        let iconColor = '';
        if (iconType === 'override') {
            iconSymbol = '↑';
            iconColor = '#4CAF50';
        } else if (iconType === 'implemented') {
            iconSymbol = '↓';
            iconColor = '#2196F3';
        }

        return {
            range,
            hoverMessage,
            renderOptions: {
                before: {
                    contentText: iconSymbol + ' ',
                    color: iconColor,
                    fontWeight: 'bold'
                }
            }
        };
    }

    private applyDecorations(
        editor: vscode.TextEditor,
        overrideDecorations: vscode.DecorationOptions[],
        implementedDecorations: vscode.DecorationOptions[]
    ) {
        // Create separate decoration types for each icon type (without gutter icons)
        const overrideDecorationType = vscode.window.createTextEditorDecorationType({});
        const implementedDecorationType = vscode.window.createTextEditorDecorationType({});

        editor.setDecorations(overrideDecorationType, overrideDecorations);
        editor.setDecorations(implementedDecorationType, implementedDecorations);
    }

    /**
     * Navigate to implementations of a class or method
     */
    public async navigateToImplementations(document: vscode.TextDocument, line: number, direct: boolean = false) {
        const classes = this.parser.parseDocument(document);
        console.log(`[navigateToImplementations] Line ${line}, direct: ${direct}`);

        // Find the class or method at the given line
        for (const classInfo of classes) {
            if (classInfo.startLine === line) {
                console.log(`[navigateToImplementations] Found class: ${classInfo.name}`);
                // Navigate to subclasses
                await this.showSubclasses(classInfo.name, direct);
                return;
            }

            for (const method of classInfo.methods) {
                if (method.line === line) {
                    console.log(`[navigateToImplementations] Found method: ${classInfo.name}.${method.name}`);
                    // Navigate to method implementations
                    await this.showMethodImplementations(classInfo.name, method.name, direct);
                    return;
                }
            }
        }

        console.log(`[navigateToImplementations] No class or method found at line ${line}`);
        vscode.window.showInformationMessage('No implementations found');
    }

    /**
     * Navigate to superclass
     */
    public async navigateToSuperclass(document: vscode.TextDocument, line: number, direct: boolean = false) {
        const classes = this.parser.parseDocument(document);
        console.log(`[navigateToSuperclass] Line ${line}, direct: ${direct}`);

        // Find the class or method at the given line
        for (const classInfo of classes) {
            if (classInfo.startLine === line) {
                console.log(`[navigateToSuperclass] Found class: ${classInfo.name}`);
                // Navigate to parent class
                if (classInfo.superclasses.length > 0) {
                    await this.showParentClasses(classInfo.superclasses, direct);
                }
                return;
            }

            for (const method of classInfo.methods) {
                if (method.line === line) {
                    console.log(`[navigateToSuperclass] Found method: ${classInfo.name}.${method.name}`);
                    // Navigate to parent method
                    await this.showParentMethod(classInfo, method.name, direct);
                    return;
                }
            }
        }

        console.log(`[navigateToSuperclass] No class or method found at line ${line}`);
        vscode.window.showInformationMessage('No parent class found');
    }

    private async showSubclasses(className: string, direct: boolean = false) {
        const subclasses = await this.parser.findSubclasses(className);

        if (subclasses.size === 0) {
            vscode.window.showInformationMessage('No subclasses found');
            return;
        }

        const items: Array<{filePath: string, cls: any}> = [];
        for (const [filePath, classes] of subclasses) {
            for (const cls of classes) {
                items.push({filePath, cls});
            }
        }

        // If only one item, navigate immediately (always)
        if (items.length === 1) {
            this.isNavigating = true;
            const item = items[0];
            const document = await vscode.workspace.openTextDocument(item.filePath);
            const editor = await vscode.window.showTextDocument(document);
            const position = new vscode.Position(item.cls.startLine, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            setTimeout(() => { this.isNavigating = false; }, 100);
            return;
        }

        // Show Quick Pick for multiple items
        const quickPickItems: vscode.QuickPickItem[] = items.map(item => ({
            label: item.cls.name,
            description: item.filePath,
            detail: `Line ${item.cls.startLine + 1}`
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a subclass to navigate to'
        });

        if (selected && selected.description) {
            this.isNavigating = true;
            const document = await vscode.workspace.openTextDocument(selected.description);
            const editor = await vscode.window.showTextDocument(document);
            const lineNumber = parseInt(selected.detail?.replace('Line ', '') || '1') - 1;
            const position = new vscode.Position(lineNumber, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            setTimeout(() => { this.isNavigating = false; }, 100);
        }
    }

    private async showMethodImplementations(className: string, methodName: string, direct: boolean = false) {
        const implementations = await this.parser.findMethodImplementations(className, methodName);

        if (implementations.length === 0) {
            vscode.window.showInformationMessage('No implementations found');
            return;
        }

        // If only one implementation, navigate immediately (always)
        if (implementations.length === 1) {
            this.isNavigating = true;
            const impl = implementations[0];
            const editor = await vscode.window.showTextDocument(impl.document);
            const position = new vscode.Position(impl.line, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            setTimeout(() => { this.isNavigating = false; }, 100);
            return;
        }

        // Show Quick Pick for multiple implementations
        const items: vscode.QuickPickItem[] = implementations.map(impl => ({
            label: `${impl.className}.${methodName}`,
            description: impl.document.uri.fsPath,
            detail: `Line ${impl.line + 1}`
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an implementation to navigate to'
        });

        if (selected && selected.description) {
            this.isNavigating = true;
            const document = await vscode.workspace.openTextDocument(selected.description);
            const editor = await vscode.window.showTextDocument(document);
            const lineNumber = parseInt(selected.detail?.replace('Line ', '') || '1') - 1;
            const position = new vscode.Position(lineNumber, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            setTimeout(() => { this.isNavigating = false; }, 100);
        }
    }

    private async showParentClasses(superclasses: string[], direct: boolean = false) {
        const parents: Array<{document: any, classInfo: any}> = [];

        for (const superclass of superclasses) {
            const parent = await this.parser.findParentClass(superclass);
            if (parent) {
                parents.push(parent);
            }
        }

        if (parents.length === 0) {
            vscode.window.showInformationMessage('Parent class not found in workspace');
            return;
        }

        // If only one parent, navigate immediately (always)
        if (parents.length === 1) {
            this.isNavigating = true;
            const parent = parents[0];
            const editor = await vscode.window.showTextDocument(parent.document);
            const position = new vscode.Position(parent.classInfo.startLine, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            setTimeout(() => { this.isNavigating = false; }, 100);
            return;
        }

        // Show Quick Pick for multiple parents
        const items: vscode.QuickPickItem[] = parents.map(parent => ({
            label: parent.classInfo.name,
            description: parent.document.uri.fsPath,
            detail: `Line ${parent.classInfo.startLine + 1}`
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a parent class to navigate to'
        });

        if (selected && selected.description) {
            this.isNavigating = true;
            const document = await vscode.workspace.openTextDocument(selected.description);
            const editor = await vscode.window.showTextDocument(document);
            const lineNumber = parseInt(selected.detail?.replace('Line ', '') || '1') - 1;
            const position = new vscode.Position(lineNumber, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            setTimeout(() => { this.isNavigating = false; }, 100);
        }
    }

    private async showParentMethod(classInfo: ClassInfo, methodName: string, direct: boolean = false) {
        console.log(`[showParentMethod] Looking for parent of ${classInfo.name}.${methodName}, superclasses: ${classInfo.superclasses.join(', ')}`);

        // Direct mode doesn't affect this - always navigate to first found parent method
        for (const superclass of classInfo.superclasses) {
            console.log(`[showParentMethod] Checking superclass: ${superclass}`);
            const parent = await this.parser.findParentClass(superclass);
            if (parent) {
                console.log(`[showParentMethod] Found parent class: ${parent.classInfo.name}`);
                const method = parent.classInfo.methods.find(m => m.name === methodName);
                if (method) {
                    console.log(`[showParentMethod] Found parent method at line ${method.line}, navigating...`);
                    this.isNavigating = true;
                    const editor = await vscode.window.showTextDocument(parent.document);
                    const position = new vscode.Position(method.line, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                    setTimeout(() => { this.isNavigating = false; }, 100);
                    return;
                } else {
                    console.log(`[showParentMethod] Method ${methodName} not found in parent class ${parent.classInfo.name}`);
                }
            } else {
                console.log(`[showParentMethod] Parent class ${superclass} not found in workspace`);
            }
        }

        console.log(`[showParentMethod] Parent method not found`);
        vscode.window.showInformationMessage('Parent method not found');
    }
}
