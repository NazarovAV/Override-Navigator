import * as vscode from 'vscode';
import { PythonParser, ClassInfo } from './pythonParser';

export class ClassNavigationCodeLensProvider implements vscode.CodeLensProvider {
    private parser: PythonParser;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(parser: PythonParser) {
        this.parser = parser;

        // Refresh code lenses when documents change
        vscode.workspace.onDidChangeTextDocument(() => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (document.languageId !== 'python') {
            return [];
        }

        return this.getCodeLenses(document);
    }

    private async getCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        const classes = this.parser.parseDocument(document);

        for (const classInfo of classes) {
            // Add code lens for class inheritance
            const classCodeLenses = await this.createClassCodeLenses(document, classInfo);
            codeLenses.push(...classCodeLenses);

            // Add code lens for methods
            for (const method of classInfo.methods) {
                const methodCodeLenses = await this.createMethodCodeLenses(document, classInfo, method.name, method.line);
                codeLenses.push(...methodCodeLenses);
            }
        }

        return codeLenses;
    }

    private async createClassCodeLenses(document: vscode.TextDocument, classInfo: ClassInfo): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        const range = new vscode.Range(classInfo.startLine, 0, classInfo.startLine, 0);

        // Check for parent classes
        if (classInfo.superclasses.length > 0) {
            const parentText = classInfo.superclasses.length === 1
                ? `↑ ${classInfo.superclasses[0]}`
                : `↑ ${classInfo.superclasses.length} parents`;

            codeLenses.push(new vscode.CodeLens(range, {
                title: parentText,
                tooltip: `Go to parent class: ${classInfo.superclasses.join(', ')}`,
                command: 'python-class-navigator.navigateToSuperclass',
                arguments: [document, classInfo.startLine]
            }));
        }

        // Check for subclasses
        const subclasses = await this.parser.findSubclasses(classInfo.name);
        if (subclasses.size > 0) {
            const subclassCount = Array.from(subclasses.values()).flat().length;
            const subclassText = subclassCount === 1
                ? '↓ 1 subclass'
                : `↓ ${subclassCount} subclasses`;

            codeLenses.push(new vscode.CodeLens(range, {
                title: subclassText,
                tooltip: 'Go to subclasses',
                command: 'python-class-navigator.navigateToImplementations',
                arguments: [document, classInfo.startLine]
            }));
        }

        return codeLenses;
    }

    private async createMethodCodeLenses(
        document: vscode.TextDocument,
        classInfo: ClassInfo,
        methodName: string,
        line: number
    ): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        const range = new vscode.Range(line, 0, line, 0);

        // Check if method overrides parent
        const isOverriding = await this.parser.isMethodOverriding(classInfo, methodName);
        if (isOverriding) {
            codeLenses.push(new vscode.CodeLens(range, {
                title: '↑ overrides',
                tooltip: 'Go to parent method',
                command: 'python-class-navigator.navigateToSuperclass',
                arguments: [document, line]
            }));
        }

        // Check for method implementations in subclasses
        const implementations = await this.parser.findMethodImplementations(classInfo.name, methodName);
        if (implementations.length > 0) {
            const implText = implementations.length === 1
                ? '↓ 1 impl'
                : `↓ ${implementations.length} impls`;

            codeLenses.push(new vscode.CodeLens(range, {
                title: implText,
                tooltip: 'Go to implementations',
                command: 'python-class-navigator.navigateToImplementations',
                arguments: [document, line]
            }));
        }

        return codeLenses;
    }
}
