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

    // Register commands - now accept either document or URI, and optional direct flag
    // direct = false means show menu if multiple options
    const navigateToImplementations = vscode.commands.registerCommand(
        'python-class-navigator.navigateToImplementations',
        async (documentOrUri: vscode.TextDocument | vscode.Uri, line: number, direct: boolean = false) => {
            const document = documentOrUri instanceof vscode.Uri
                ? await vscode.workspace.openTextDocument(documentOrUri)
                : documentOrUri;
            await hierarchyProvider.navigateToImplementations(document, line, direct);
        }
    );

    const navigateToSuperclass = vscode.commands.registerCommand(
        'python-class-navigator.navigateToSuperclass',
        async (documentOrUri: vscode.TextDocument | vscode.Uri, line: number, direct: boolean = false) => {
            const document = documentOrUri instanceof vscode.Uri
                ? await vscode.workspace.openTextDocument(documentOrUri)
                : documentOrUri;
            await hierarchyProvider.navigateToSuperclass(document, line, direct);
        }
    );

    // Add click handler for inline icons
    const clickHandler = vscode.commands.registerCommand(
        'python-class-navigator.handleIconClick',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'python') {
                return;
            }

            const line = editor.selection.active.line;
            const classes = parser.parseDocument(editor.document);

            // Check if clicked on a class or method line
            for (const classInfo of classes) {
                if (classInfo.startLine === line) {
                    // Clicked on class - navigate based on what's available
                    if (classInfo.superclasses.length > 0) {
                        await hierarchyProvider.navigateToSuperclass(editor.document, line);
                    } else {
                        const subclasses = await parser.findSubclasses(classInfo.name);
                        if (subclasses.size > 0) {
                            await hierarchyProvider.navigateToImplementations(editor.document, line);
                        }
                    }
                    return;
                }

                for (const method of classInfo.methods) {
                    if (method.line === line) {
                        // Clicked on method - check what's available
                        const isOverriding = await parser.isMethodOverriding(classInfo, method.name);
                        if (isOverriding) {
                            await hierarchyProvider.navigateToSuperclass(editor.document, line);
                        } else {
                            await hierarchyProvider.navigateToImplementations(editor.document, line);
                        }
                        return;
                    }
                }
            }
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

    // Add click handler for inline icons - triggered when user clicks
    const clickListener = vscode.window.onDidChangeTextEditorSelection(async event => {
        const editor = event.textEditor;
        if (!editor || editor.document.languageId !== 'python') {
            return;
        }

        // Check if click was at the beginning of a line (where icons are)
        const selection = event.selections[0];
        if (!selection.isEmpty) {
            return; // Not a click, it's a selection
        }

        const position = selection.active;
        // If clicked at column 0 or 1 (where the icon is), trigger navigation
        if (position.character <= 1) {
            const line = position.line;
            const classes = parser.parseDocument(editor.document);

            // Check if this line has an icon
            for (const classInfo of classes) {
                if (classInfo.startLine === line) {
                    // Clicked on class line
                    if (classInfo.superclasses.length > 0) {
                        await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
                    } else {
                        const subclasses = await parser.findSubclasses(classInfo.name);
                        if (subclasses.size > 0) {
                            await hierarchyProvider.navigateToImplementations(editor.document, line, false);
                        }
                    }
                    return;
                }

                for (const method of classInfo.methods) {
                    if (method.line === line) {
                        // Clicked on method line
                        const isOverriding = await parser.isMethodOverriding(classInfo, method.name);
                        if (isOverriding) {
                            await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
                        } else {
                            const impls = await parser.findMethodImplementations(classInfo.name, method.name);
                            if (impls.length > 0) {
                                await hierarchyProvider.navigateToImplementations(editor.document, line, false);
                            }
                        }
                        return;
                    }
                }
            }
        }
    });

    // Update decorations for the current editor
    if (vscode.window.activeTextEditor?.document.languageId === 'python') {
        hierarchyProvider.updateDecorations(vscode.window.activeTextEditor);
    }

    // Register keybinding for clicking on icon (Alt+Enter)
    const iconClickKeybinding = vscode.commands.registerCommand(
        'python-class-navigator.iconClick',
        () => vscode.commands.executeCommand('python-class-navigator.handleIconClick')
    );

    context.subscriptions.push(
        navigateToImplementations,
        navigateToSuperclass,
        clickHandler,
        iconClickKeybinding,
        activeEditorChanged,
        documentChanged,
        clickListener,
        codeLensProviderDisposable
    );
}

export function deactivate() {}
