import * as vscode from 'vscode';
import { PythonParser, ClassInfo } from './pythonParser';
import { ClassHierarchyProvider } from './classHierarchyProvider';
import { ClassNavigationCodeLensProvider } from './codeLensProvider';

export function activate(context: vscode.ExtensionContext) {
    const parser = new PythonParser();
    const hierarchyProvider = new ClassHierarchyProvider(parser, context);
    const codeLensProvider = new ClassNavigationCodeLensProvider(parser);

    // Register CodeLens provider
    const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
        { language: 'python', scheme: 'file' },
        codeLensProvider
    );

    // Register navigation commands
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

    // Handle clicks on inline navigation icons
    const clickListener = vscode.window.onDidChangeTextEditorSelection(async event => {
        await handleIconClick(event, parser, hierarchyProvider);
    });

    // Initialize decorations for the current editor
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

/**
 * Handle click events on navigation icons
 */
async function handleIconClick(
    event: vscode.TextEditorSelectionChangeEvent,
    parser: PythonParser,
    hierarchyProvider: ClassHierarchyProvider
) {
    const editor = event.textEditor;

    if (!editor || editor.document.languageId !== 'python') {
        return;
    }

    const selection = event.selections[0];
    if (!selection.isEmpty) {
        return;
    }

    const position = selection.active;

    // Check if click was in the icon area (column 0-3)
    if (position.character > 3) {
        return;
    }

    // Prevent rapid successive navigations (debounce)
    if (!hierarchyProvider.canNavigate()) {
        return;
    }

    const line = position.line;
    const classes = parser.parseDocument(editor.document);

    // Try to find a class at this line
    for (const classInfo of classes) {
        if (classInfo.startLine === line) {
            await handleClassClick(classInfo, parser, hierarchyProvider, editor, line);
            return;
        }

        // Try to find a method at this line
        for (const method of classInfo.methods) {
            if (method.line === line) {
                await handleMethodClick(classInfo, method.name, parser, hierarchyProvider, editor, line);
                return;
            }
        }
    }
}

/**
 * Handle click on a class declaration
 */
async function handleClassClick(
    classInfo: ClassInfo,
    parser: PythonParser,
    hierarchyProvider: ClassHierarchyProvider,
    editor: vscode.TextEditor,
    line: number
) {
    const hasParent = classInfo.superclasses.length > 0;
    const subclasses = await parser.findSubclasses(classInfo.name);
    const hasChildren = subclasses.size > 0;

    if (hasParent && hasChildren) {
        const choice = await vscode.window.showQuickPick([
            {
                label: '↑ Go to parent class',
                description: classInfo.superclasses.join(', '),
                value: 'parent'
            },
            {
                label: '↓ Go to child classes',
                description: `${subclasses.size} subclass(es)`,
                value: 'children'
            }
        ], {
            placeHolder: 'Choose navigation direction'
        });

        if (!choice) {
            return;
        }

        if (choice.value === 'parent') {
            await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
        } else {
            await hierarchyProvider.navigateToImplementations(editor.document, line, false);
        }
    } else if (hasParent) {
        await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
    } else if (hasChildren) {
        await hierarchyProvider.navigateToImplementations(editor.document, line, false);
    }
}

/**
 * Handle click on a method declaration
 */
async function handleMethodClick(
    classInfo: ClassInfo,
    methodName: string,
    parser: PythonParser,
    hierarchyProvider: ClassHierarchyProvider,
    editor: vscode.TextEditor,
    line: number
) {
    const isOverriding = await parser.isMethodOverriding(classInfo, methodName);
    const implementations = await parser.findMethodImplementations(classInfo.name, methodName);

    if (isOverriding && implementations.length > 0) {
        const choice = await vscode.window.showQuickPick([
            {
                label: '↑ Go to parent method',
                description: `In ${classInfo.superclasses.join(', ')}`,
                value: 'parent'
            },
            {
                label: '↓ Go to child implementations',
                description: `${implementations.length} implementation(s)`,
                value: 'children'
            }
        ], {
            placeHolder: 'Choose navigation direction'
        });

        if (!choice) {
            return;
        }

        if (choice.value === 'parent') {
            await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
        } else {
            await hierarchyProvider.navigateToImplementations(editor.document, line, false);
        }
    } else if (isOverriding) {
        await hierarchyProvider.navigateToSuperclass(editor.document, line, false);
    } else if (implementations.length > 0) {
        await hierarchyProvider.navigateToImplementations(editor.document, line, false);
    }
}

export function deactivate() {}
