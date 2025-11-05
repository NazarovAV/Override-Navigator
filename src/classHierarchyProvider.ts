import * as vscode from 'vscode';
import { PythonParser, ClassInfo } from './pythonParser';

interface NavigationTarget {
    document: vscode.TextDocument;
    line: number;
    displayName: string;
}

/**
 * Manages class hierarchy navigation and visual decorations
 */
export class ClassHierarchyProvider {
    private parser: PythonParser;
    private context: vscode.ExtensionContext;
    private lastNavigationTime: number = 0;
    private readonly navigationCooldownMs = 50;

    constructor(parser: PythonParser, context: vscode.ExtensionContext) {
        this.parser = parser;
        this.context = context;
    }

    /**
     * Check if enough time has passed since last navigation to allow a new one
     * This prevents rapid successive navigations and event loops
     */
    public canNavigate(): boolean {
        const now = Date.now();
        const timeSinceLastNav = now - this.lastNavigationTime;
        return timeSinceLastNav > this.navigationCooldownMs;
    }

    /**
     * Update inline navigation decorations for the current editor
     */
    public async updateDecorations(editor: vscode.TextEditor) {
        if (!editor || editor.document.languageId !== 'python') {
            return;
        }

        const classes = this.parser.parseDocument(editor.document);
        const overrideDecorations: vscode.DecorationOptions[] = [];
        const implementedDecorations: vscode.DecorationOptions[] = [];

        for (const classInfo of classes) {
            await this.addClassDecorations(classInfo, overrideDecorations, implementedDecorations);
            await this.addMethodDecorations(classInfo, overrideDecorations, implementedDecorations);
        }

        this.applyDecorations(editor, overrideDecorations, implementedDecorations);
    }

    /**
     * Navigate to implementations of a class or method
     */
    public async navigateToImplementations(document: vscode.TextDocument, line: number, direct: boolean = false) {
        const classes = this.parser.parseDocument(document);

        for (const classInfo of classes) {
            if (classInfo.startLine === line) {
                await this.showSubclasses(classInfo.name);
                return;
            }

            for (const method of classInfo.methods) {
                if (method.line === line) {
                    await this.showMethodImplementations(classInfo.name, method.name);
                    return;
                }
            }
        }

        vscode.window.showInformationMessage('No implementations found');
    }

    /**
     * Navigate to superclass or parent method
     */
    public async navigateToSuperclass(document: vscode.TextDocument, line: number, direct: boolean = false) {
        const classes = this.parser.parseDocument(document);

        for (const classInfo of classes) {
            if (classInfo.startLine === line) {
                if (classInfo.superclasses.length > 0) {
                    await this.showParentClasses(classInfo.superclasses);
                }
                return;
            }

            for (const method of classInfo.methods) {
                if (method.line === line) {
                    await this.showParentMethod(classInfo, method.name);
                    return;
                }
            }
        }

        vscode.window.showInformationMessage('No parent class found');
    }

    // ==================== Private Helper Methods ====================

    private markNavigationTime() {
        this.lastNavigationTime = Date.now();
    }

    private async addClassDecorations(
        classInfo: ClassInfo,
        overrideDecorations: vscode.DecorationOptions[],
        implementedDecorations: vscode.DecorationOptions[]
    ) {
        if (classInfo.superclasses.length > 0) {
            overrideDecorations.push(
                this.createDecoration(
                    classInfo.startLine,
                    'override',
                    `Go to parent class: ${classInfo.superclasses.join(', ')}`
                )
            );
        }

        const subclasses = await this.parser.findSubclasses(classInfo.name);
        if (subclasses.size > 0) {
            const subclassNames = Array.from(subclasses.values())
                .flat()
                .map(c => c.name)
                .join(', ');
            implementedDecorations.push(
                this.createDecoration(
                    classInfo.startLine,
                    'implemented',
                    `Go to subclasses: ${subclassNames}`
                )
            );
        }
    }

    private async addMethodDecorations(
        classInfo: ClassInfo,
        overrideDecorations: vscode.DecorationOptions[],
        implementedDecorations: vscode.DecorationOptions[]
    ) {
        for (const method of classInfo.methods) {
            const isOverriding = await this.parser.isMethodOverriding(classInfo, method.name);
            const implementations = await this.parser.findMethodImplementations(classInfo.name, method.name);

            if (isOverriding) {
                overrideDecorations.push(
                    this.createDecoration(method.line, 'override', 'Overrides parent method')
                );
            }

            if (implementations.length > 0) {
                implementedDecorations.push(
                    this.createDecoration(
                        method.line,
                        'implemented',
                        `${implementations.length} implementation(s) in subclasses`
                    )
                );
            }
        }
    }

    private createDecoration(
        line: number,
        iconType: 'override' | 'implemented',
        hoverMessage: string
    ): vscode.DecorationOptions {
        const iconSymbol = iconType === 'override' ? '↑' : '↓';
        const iconColor = iconType === 'override' ? '#4CAF50' : '#2196F3';

        return {
            range: new vscode.Range(line, 0, line, 0),
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
        const overrideDecorationType = vscode.window.createTextEditorDecorationType({});
        const implementedDecorationType = vscode.window.createTextEditorDecorationType({});

        editor.setDecorations(overrideDecorationType, overrideDecorations);
        editor.setDecorations(implementedDecorationType, implementedDecorations);
    }

    private async navigateToPosition(document: vscode.TextDocument, line: number) {
        this.markNavigationTime();

        const editor = await vscode.window.showTextDocument(document);
        const position = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
    }

    private async showNavigationMenu(
        targets: NavigationTarget[],
        placeHolder: string
    ): Promise<void> {
        if (targets.length === 0) {
            vscode.window.showInformationMessage('No targets found');
            return;
        }

        if (targets.length === 1) {
            await this.navigateToPosition(targets[0].document, targets[0].line);
            return;
        }

        const quickPickItems: vscode.QuickPickItem[] = targets.map(target => ({
            label: target.displayName,
            description: target.document.uri.fsPath,
            detail: `Line ${target.line + 1}`
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, { placeHolder });

        if (selected && selected.description) {
            const document = await vscode.workspace.openTextDocument(selected.description);
            const lineNumber = parseInt(selected.detail?.replace('Line ', '') || '1') - 1;
            await this.navigateToPosition(document, lineNumber);
        }
    }

    private async showSubclasses(className: string) {
        const subclasses = await this.parser.findSubclasses(className);

        if (subclasses.size === 0) {
            vscode.window.showInformationMessage('No subclasses found');
            return;
        }

        const targets: NavigationTarget[] = [];
        for (const [filePath, classes] of subclasses) {
            const document = await vscode.workspace.openTextDocument(filePath);
            for (const cls of classes) {
                targets.push({
                    document,
                    line: cls.startLine,
                    displayName: cls.name
                });
            }
        }

        await this.showNavigationMenu(targets, 'Select a subclass to navigate to');
    }

    private async showMethodImplementations(className: string, methodName: string) {
        const implementations = await this.parser.findMethodImplementations(className, methodName);

        if (implementations.length === 0) {
            vscode.window.showInformationMessage('No implementations found');
            return;
        }

        const targets: NavigationTarget[] = implementations.map(impl => ({
            document: impl.document,
            line: impl.line,
            displayName: `${impl.className}.${methodName}`
        }));

        await this.showNavigationMenu(targets, 'Select an implementation to navigate to');
    }

    private async showParentClasses(superclasses: string[]) {
        const targets: NavigationTarget[] = [];

        for (const superclass of superclasses) {
            const parent = await this.parser.findParentClass(superclass);
            if (parent) {
                targets.push({
                    document: parent.document,
                    line: parent.classInfo.startLine,
                    displayName: parent.classInfo.name
                });
            }
        }

        if (targets.length === 0) {
            vscode.window.showInformationMessage('Parent class not found in workspace');
            return;
        }

        await this.showNavigationMenu(targets, 'Select a parent class to navigate to');
    }

    private async showParentMethod(classInfo: ClassInfo, methodName: string) {
        for (const superclass of classInfo.superclasses) {
            const parent = await this.parser.findParentClass(superclass);
            if (parent) {
                const method = parent.classInfo.methods.find(m => m.name === methodName);
                if (method) {
                    await this.navigateToPosition(parent.document, method.line);
                    return;
                }
            }
        }

        vscode.window.showInformationMessage('Parent method not found');
    }
}
