# Contributing to Python Class Navigator

Thank you for your interest in contributing to Python Class Navigator! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit code changes
- ✅ Write tests
- 🌍 Translate (future)

## 🚀 Getting Started

### Prerequisites

Required tools:
- **Node.js** 18.x or higher
- **npm** 8.x or higher
- **VS Code** 1.80.0 or higher
- **Git** for version control

### Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/python-class-navigator.git
cd python-class-navigator

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile

# 4. Run in development mode
# Open VS Code and press F5
# This launches the Extension Development Host
```

### Development Workflow

```bash
# Watch mode (auto-compile on file changes)
npm run watch

# Lint code
npm run lint

# Compile for production
npm run compile

# Package extension
npm run package
```

## 📁 Project Structure

```
python-class-navigator/
├── src/
│   ├── extension.ts              # Entry point, activation, event handling
│   ├── pythonParser.ts           # Python code parsing and analysis
│   ├── classHierarchyProvider.ts # Navigation logic and decorations
│   └── codeLensProvider.ts       # CodeLens integration
│
├── examples/
│   ├── test_inheritance.py       # Simple inheritance examples
│   └── test_multiple_files.py    # Multi-file navigation tests
│
├── out/                          # Compiled JavaScript (generated)
├── node_modules/                 # Dependencies (generated)
│
├── .eslintrc.json               # ESLint configuration
├── .vscodeignore                # Files to exclude from package
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Extension manifest
│
└── *.md                         # Documentation
```

## 🏗️ Architecture Overview

### Core Components

#### **PythonParser** (`pythonParser.ts`)
- **Purpose**: Parse Python code to extract class and method information
- **Methods**:
  - `parseDocument()` - Extract all classes from a document
  - `findSubclasses()` - Find child classes across workspace
  - `findParentClass()` - Locate parent class definition
  - `isMethodOverriding()` - Check if method overrides parent
  - `findMethodImplementations()` - Find child method implementations
- **Technology**: Regex-based parsing (lightweight, fast)

#### **ClassHierarchyProvider** (`classHierarchyProvider.ts`)
- **Purpose**: Manage navigation and visual decorations
- **Key Features**:
  - Creates inline arrow decorations (↑ ↓)
  - Handles navigation logic
  - Manages navigation cooldown (50ms)
  - Shows quick pick menus for multiple targets
- **Public API**:
  - `updateDecorations()` - Refresh visual indicators
  - `navigateToImplementations()` - Navigate to children
  - `navigateToSuperclass()` - Navigate to parents
  - `canNavigate()` - Check cooldown status

#### **ClassNavigationCodeLensProvider** (`codeLensProvider.ts`)
- **Purpose**: Provide CodeLens links above declarations
- **Features**:
  - "Go to parent class/method" links
  - "Go to implementations" links
  - Dynamic text based on target count

#### **Extension** (`extension.ts`)
- **Purpose**: Extension lifecycle and coordination
- **Responsibilities**:
  - Register providers and commands
  - Handle click events on arrows
  - Manage editor state changes
  - Coordinate navigation actions

### Data Flow

```
User clicks arrow
    ↓
extension.ts: handleIconClick()
    ↓
ClassHierarchyProvider: canNavigate()? → Check cooldown
    ↓
PythonParser: parseDocument() → Get class info
    ↓
ClassHierarchyProvider: navigateToX() → Execute navigation
    ↓
Show target or quick pick menu
```

## 💻 Code Guidelines

### TypeScript Best Practices

```typescript
// ✅ Good: Explicit types, clear names
public async navigateToParent(document: vscode.TextDocument, line: number): Promise<void> {
    const classes = this.parser.parseDocument(document);
    // Implementation...
}

// ❌ Bad: Implicit any, unclear names
public async nav(doc, ln) {
    const c = this.parser.parse(doc);
    // Implementation...
}
```

### Naming Conventions

- **Classes**: `PascalCase` (e.g., `PythonParser`)
- **Interfaces**: `PascalCase` (e.g., `NavigationTarget`)
- **Methods**: `camelCase` (e.g., `navigateToImplementations`)
- **Variables**: `camelCase` (e.g., `lineNumber`)
- **Constants**: `camelCase` for readonly (e.g., `navigationCooldownMs`)
- **Private methods**: prefix with `private` (e.g., `private showMenu()`)

### Documentation

Always add JSDoc comments for public methods:

```typescript
/**
 * Navigate to parent class or overridden method
 *
 * @param document - The text document containing the source code
 * @param line - The line number (0-indexed) of the class/method
 * @param direct - If true, navigate directly without showing menu
 */
public async navigateToSuperclass(
    document: vscode.TextDocument,
    line: number,
    direct: boolean = false
): Promise<void> {
    // Implementation...
}
```

### Error Handling

```typescript
// ✅ Good: Graceful error handling
try {
    await this.navigateToPosition(document, line);
} catch (error) {
    vscode.window.showErrorMessage(`Navigation failed: ${error.message}`);
}

// ❌ Bad: Silent failures
await this.navigateToPosition(document, line);
```

### Async/Await

```typescript
// ✅ Good: Proper async/await usage
public async findParentClass(className: string): Promise<ClassInfo | null> {
    const files = await vscode.workspace.findFiles('**/*.py');
    for (const file of files) {
        const doc = await vscode.workspace.openTextDocument(file);
        // Process document...
    }
    return null;
}

// ❌ Bad: Mixing callbacks and promises
public findParentClass(className: string, callback: Function) {
    vscode.workspace.findFiles('**/*.py').then(files => {
        callback(files);
    });
}
```

## 🧪 Testing

### Manual Testing Scenarios

Test these scenarios before submitting PRs:

#### Basic Functionality
- [ ] Arrows appear on classes with parents
- [ ] Arrows appear on classes with children
- [ ] Arrows appear on overridden methods
- [ ] Arrows appear on methods with implementations
- [ ] CodeLens links appear correctly

#### Navigation
- [ ] Click parent arrow → navigates to parent
- [ ] Click child arrow → shows menu or navigates
- [ ] Click on bidirectional → shows direction menu
- [ ] Navigation works across files
- [ ] Quick pick menu shows correct targets

#### Edge Cases
- [ ] Multiple inheritance
- [ ] Deep inheritance hierarchies (3+ levels)
- [ ] Classes without parents or children
- [ ] Methods with same name in different classes
- [ ] Large files (100+ classes)
- [ ] Rapid clicking (test cooldown)

### Test Files

Use the provided example files:
- `examples/test_inheritance.py` - Basic inheritance
- `examples/test_multiple_files.py` - Cross-file navigation

### Debugging

1. **Set breakpoints** in VS Code
2. **Press F5** to start debugging
3. **Extension Host opens** - this is your test environment
4. **Open Python file** to test
5. **Check Developer Tools**:
   - Press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
   - View Console for logs and errors

## 📋 Pull Request Process

### Before Submitting

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow code guidelines
   - Add JSDoc comments
   - Test thoroughly

3. **Verify quality**
   ```bash
   npm run compile  # Must succeed
   npm run lint     # Must have 0 warnings
   ```

4. **Update documentation** if needed
   - Update README.md for new features
   - Add entry to CHANGELOG.md
   - Update CONTRIBUTING.md for new processes

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `refactor:` - Code refactoring
   - `test:` - Tests
   - `chore:` - Build/tooling

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### PR Requirements

Your PR should include:
- [ ] Clear description of changes
- [ ] Manual testing results
- [ ] Screenshots/GIFs for UI changes
- [ ] Updated documentation
- [ ] No linter errors
- [ ] Compiles successfully

### Code Review

- PRs require approval from maintainers
- Address review comments promptly
- Keep PRs focused and reasonably sized
- Be respectful and constructive

## 🐛 Bug Reports

When reporting bugs, include:
1. **VS Code version**: `Help > About`
2. **Extension version**: Check Extensions panel
3. **OS**: Windows/Mac/Linux version
4. **Steps to reproduce**: Detailed steps
5. **Expected behavior**: What should happen
6. **Actual behavior**: What actually happens
7. **Screenshots**: If applicable
8. **Logs**: From Developer Tools console

## 💡 Feature Requests

When suggesting features:
1. **Use case**: Why is this needed?
2. **Proposed solution**: How should it work?
3. **Alternatives**: Other solutions considered?
4. **UI mockups**: If applicable

## 📞 Questions?

- **GitHub Issues**: For bugs and features
- **Discussions**: For questions and ideas
- **Email**: For private inquiries

## 🙏 Recognition

Contributors will be recognized in:
- CHANGELOG.md
- README.md (future)
- GitHub contributors page

Thank you for contributing! 🎉
