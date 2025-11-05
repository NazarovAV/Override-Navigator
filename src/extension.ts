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

    // Watch for document changes to update decorations
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

    // Add click handler for inline icons
    const clickListener = vscode.window.onDidChangeTextEditorSelection(async event => {
        const editor = event.textEditor;
        if (!editor || editor.document.languageId !== 'python') {
            return;
        }

        // Ignore if we're currently navigating programmatically
        if (hierarchyProvider.isCurrentlyNavigating()) {
            return;
        }

        // Check if click was at the beginning of a line (where icons are)
        const selection = event.selections[0];
        if (!selection.isEmpty) {
            return; // Not a click, it's a selection
        }

        const position = selection.active;

        // If clicked at column 0-3 (where the icons are), trigger navigation
        if (position.character <= 3) {
            const line = position.line;
            const classes = parser.parseDocument(editor.document);

            // Check if this line has an icon
            for (const classInfo of classes) {
                if (classInfo.startLine === line) {
                    const hasParent = classInfo.superclasses.length > 0;
                    const subclasses = await parser.findSubclasses(classInfo.name);
                    const hasChildren = subclasses.size > 0;

                    // If has both parent and children, show menu to choose direction
                    if (hasParent && hasChildren) {
                        const choice = await vscode.window.showQuickPick([
                            { label: '↑ Go to parent class', description: classInfo.superclasses.join(', '), value: 'parent' },
                            { label: '↓ Go to child classes', description: `${subclasses.size} subclass(es)`, value: 'children' }
                        ], {
                            placeHolder: 'Choose navigation direction'
                        });

                        if (choice) {
                            if (choice.value === 'parent') {
                                await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
                            } else {
                                await hierarchyProvider.navigateToImplementations(editor.document, line, false);
                            }
                        }
                    } else if (hasParent) {
                        await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
                    } else if (hasChildren) {
                        await hierarchyProvider.navigateToImplementations(editor.document, line, false);
                    }
                    return;
                }

                for (const method of classInfo.methods) {
                    if (method.line === line) {
                        const isOverriding = await parser.isMethodOverriding(classInfo, method.name);
                        const impls = await parser.findMethodImplementations(classInfo.name, method.name);

                        // If has both parent and children, show menu to choose direction
                        if (isOverriding && impls.length > 0) {
                            const choice = await vscode.window.showQuickPick([
                                { label: '↑ Go to parent method', description: `In ${classInfo.superclasses.join(', ')}`, value: 'parent' },
                                { label: '↓ Go to child implementations', description: `${impls.length} implementation(s)`, value: 'children' }
                            ], {
                                placeHolder: 'Choose navigation direction'
                            });

                            if (choice) {
                                if (choice.value === 'parent') {
                                    await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
                                } else {
                                    await hierarchyProvider.navigateToImplementations(editor.document, line, false);
                                }
                            }
                        } else if (isOverriding) {
                            await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
                        } else if (impls.length > 0) {
                            await hierarchyProvider.navigateToImplementations(editor.document, line, false);
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

    context.subscriptions.push(
        navigateToImplementations,
        navigateToSuperclass,
        activeEditorChanged,
        documentChanged,
        clickListener,
        codeLensProviderDisposable
    );
}

export function deactivate() {}
