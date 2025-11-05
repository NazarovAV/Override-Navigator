# Contributing to Python Class Navigator

Thank you for your interest in contributing!

## Development Setup

### Prerequisites
- Node.js 18+
- VS Code
- npm

### Getting Started

```bash
# Clone and setup
git clone <repository-url>
cd python-class-navigator
npm install

# Compile
npm run compile

# Run in development mode
# Press F5 in VS Code to open Extension Development Host
```

## Project Structure

```
src/
├── extension.ts              # Extension entry point and activation
├── pythonParser.ts           # Python code parsing logic
├── classHierarchyProvider.ts # Navigation and decoration management
└── codeLensProvider.ts       # CodeLens integration

examples/
├── test_inheritance.py       # Test file for simple inheritance
└── test_multiple_files.py    # Test file for multi-file navigation
```

## Key Components

### PythonParser
- Parses Python files using regex
- Extracts classes, methods, and inheritance info
- Finds parent classes and child implementations
- Detects method overrides

### ClassHierarchyProvider
- Manages inline navigation arrows
- Handles navigation logic
- Creates and applies decorations
- Implements navigation cooldown
- Shows quick pick menus

### Extension (extension.ts)
- Registers providers and commands
- Handles click events on arrows
- Manages editor event listeners
- Coordinates navigation actions

## Development Workflow

### Running Tests

```bash
npm run compile  # Compile TypeScript
npm run lint     # Check code style
```

### Watch Mode

```bash
npm run watch    # Auto-compile on changes
```

### Debugging

1. Set breakpoints in VS Code
2. Press `F5` to start debugging
3. Extension Host window opens
4. Open Python file to test
5. Check Developer Tools console (`Cmd+Option+I` / `Ctrl+Shift+I`)

## Code Guidelines

### Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use camelCase for variables/methods
- Use PascalCase for classes/interfaces
- Add JSDoc comments for public methods
- Keep functions small and focused

### Best Practices
- Maintain single responsibility principle
- Use async/await for asynchronous operations
- Handle errors gracefully
- Avoid console.log in production code
- Keep navigation cooldown at 50ms

## Testing Scenarios

Test with:
- Simple inheritance (one parent, one child)
- Multiple inheritance
- Deep inheritance hierarchies
- Method overrides
- Multiple method implementations
- Cross-file navigation
- Large files with many classes

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Run `npm run lint`
5. Compile without errors
6. Update documentation if needed
7. Submit pull request with clear description

## Common Issues

### Navigation Not Working
- Check cooldown timing (50ms)
- Verify Python file is in workspace
- Check console for errors

### Decorations Not Appearing
- Ensure file is saved
- Check language mode is Python
- Verify classes/methods are properly formatted

## Questions?

Open an issue on GitHub for:
- Bug reports
- Feature requests
- Questions
- Documentation improvements
