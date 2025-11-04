import * as vscode from 'vscode';
import { PythonParser } from './pythonParser';
import { ClassHierarchyProvider } from './classHierarchyProvider';
import { ClassNavigationCodeLensProvider } from './codeLensProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Python Class Navigator is now active!');

    const parser = new PythonParser();
    const hierarchyProvider = new ClassHierarchyProvider(parser, context);
    const codeLensProvider = new ClassNavigationCodeLensProvider(parser);

    // Register CodeLens provider
    const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
        { language: 'python', scheme: 'file' },
        codeLensProvider
    );

    // Register commands
    const navigateToImplementations = vscode.commands.registerCommand(
        'python-class-navigator.navigateToImplementations',
        async (document: vscode.TextDocument, line: number) => {
            await hierarchyProvider.navigateToImplementations(document, line);
        }
    );

    const navigateToSuperclass = vscode.commands.registerCommand(
        'python-class-navigator.navigateToSuperclass',
        async (document: vscode.TextDocument, line: number) => {
            await hierarchyProvider.navigateToSuperclass(document, line);
        }
    );

    // Watch for document changes
    const activeEditorChanged = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'python') {
            hierarchyProvider.updateDecorations(editor);
        }
    });

    const documentChanged = vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && editor.document.languageId === 'python') {
            hierarchyProvider.updateDecorations(editor);
        }
    });

    // Update decorations for the current editor
    if (vscode.window.activeTextEditor?.document.languageId === 'python') {
        hierarchyProvider.updateDecorations(vscode.window.activeTextEditor);
    }

    context.subscriptions.push(
        navigateToImplementations,
        navigateToSuperclass,
        activeEditorChanged,
        documentChanged,
        codeLensProviderDisposable
    );
}

export function deactivate() {}
