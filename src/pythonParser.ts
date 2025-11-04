import * as vscode from 'vscode';

export interface ClassInfo {
    name: string;
    startLine: number;
    endLine: number;
    superclasses: string[];
    methods: MethodInfo[];
}

export interface MethodInfo {
    name: string;
    line: number;
    className: string;
    isInherited: boolean;
}

export class PythonParser {
    /**
     * Parse Python document to extract class hierarchy information
     */
    public parseDocument(document: vscode.TextDocument): ClassInfo[] {
        const classes: ClassInfo[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const classMatch = line.match(/^class\s+(\w+)(?:\((.*?)\))?:/);

            if (classMatch) {
                const className = classMatch[1];
                const superclassesStr = classMatch[2] || '';
                const superclasses = superclassesStr
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s && s !== 'object');

                const methods = this.extractMethods(lines, i + 1, className);
                const endLine = this.findClassEnd(lines, i);

                classes.push({
                    name: className,
                    startLine: i,
                    endLine: endLine,
                    superclasses: superclasses,
                    methods: methods
                });
            }
        }

        return classes;
    }

    /**
     * Extract methods from a class
     */
    private extractMethods(lines: string[], startLine: number, className: string): MethodInfo[] {
        const methods: MethodInfo[] = [];
        let currentIndent = this.getIndentation(lines[startLine - 1]);

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            const lineIndent = this.getIndentation(line);

            // Stop if we're back at class level or less
            if (line.trim() && lineIndent <= currentIndent) {
                break;
            }

            // Match method definitions
            const methodMatch = line.match(/^\s+def\s+(\w+)\s*\(/);
            if (methodMatch) {
                const methodName = methodMatch[1];
                methods.push({
                    name: methodName,
                    line: i,
                    className: className,
                    isInherited: false
                });
            }
        }

        return methods;
    }

    /**
     * Find the end line of a class
     */
    private findClassEnd(lines: string[], startLine: number): number {
        const classIndent = this.getIndentation(lines[startLine]);

        for (let i = startLine + 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() && this.getIndentation(line) <= classIndent) {
                return i - 1;
            }
        }

        return lines.length - 1;
    }

    /**
     * Get indentation level of a line
     */
    private getIndentation(line: string): number {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    /**
     * Find all classes in the workspace that inherit from a given class
     */
    public async findSubclasses(className: string): Promise<Map<string, ClassInfo[]>> {
        const subclasses = new Map<string, ClassInfo[]>();
        const files = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**');

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const classes = this.parseDocument(document);

                const matchingClasses = classes.filter(cls =>
                    cls.superclasses.includes(className)
                );

                if (matchingClasses.length > 0) {
                    subclasses.set(file.fsPath, matchingClasses);
                }
            } catch (error) {
                console.error(`Error parsing ${file.fsPath}:`, error);
            }
        }

        return subclasses;
    }

    /**
     * Find the parent class definition in the workspace
     */
    public async findParentClass(className: string): Promise<{ document: vscode.TextDocument; classInfo: ClassInfo } | null> {
        const files = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**');

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const classes = this.parseDocument(document);

                const matchingClass = classes.find(cls => cls.name === className);
                if (matchingClass) {
                    return { document, classInfo: matchingClass };
                }
            } catch (error) {
                console.error(`Error parsing ${file.fsPath}:`, error);
            }
        }

        return null;
    }

    /**
     * Check if a method overrides a parent method
     */
    public async isMethodOverriding(classInfo: ClassInfo, methodName: string): Promise<boolean> {
        for (const superclass of classInfo.superclasses) {
            const parent = await this.findParentClass(superclass);
            if (parent) {
                const hasMethod = parent.classInfo.methods.some(m => m.name === methodName);
                if (hasMethod) {
                    return true;
                }
                // Recursively check parent's parents
                const parentOverriding = await this.isMethodOverriding(parent.classInfo, methodName);
                if (parentOverriding) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Find all implementations of a method in subclasses
     */
    public async findMethodImplementations(className: string, methodName: string): Promise<Array<{ document: vscode.TextDocument; line: number; className: string }>> {
        const implementations: Array<{ document: vscode.TextDocument; line: number; className: string }> = [];
        const subclasses = await this.findSubclasses(className);

        for (const [filePath, classes] of subclasses) {
            const document = await vscode.workspace.openTextDocument(filePath);
            for (const cls of classes) {
                const method = cls.methods.find(m => m.name === methodName);
                if (method) {
                    implementations.push({
                        document,
                        line: method.line,
                        className: cls.name
                    });
                }
            }
        }

        return implementations;
    }
}
