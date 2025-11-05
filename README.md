# Python Class Navigator

A VS Code extension that provides PyCharm-like navigation between parent and child classes and methods in Python.

## Features

### 🎯 Visual Navigation Indicators

Inline icons appear next to class and method declarations:

- **↑** (Green) - Navigate to parent class/method
- **↓** (Blue) - Navigate to child classes/implementations
- **↑ ↓** (Both) - Class/method with both parent and children

### 🔍 Navigation Capabilities

#### Class Navigation
- Jump to parent/base classes
- Jump to child/derived classes
- Works across multiple files in your workspace

#### Method Navigation
- Jump to overridden parent methods
- Jump to child method implementations
- Automatically detects method overrides

### 📝 CodeLens Integration

Clickable links appear above class and method declarations for quick navigation.

### 🖱️ Click Navigation

Click on the navigation arrows (↑ ↓) to navigate:
- **Single target**: Navigate immediately
- **Multiple targets**: Choose from a quick pick menu
- **Both directions**: Choose whether to go up or down the hierarchy

## Usage

### Quick Start

1. Open any Python file
2. Look for the colored arrows (↑ ↓) next to class and method declarations
3. Click on an arrow to navigate
4. Use CodeLens links for alternative navigation

### Navigation Patterns

**Parent Navigation (↑)**
- Click the green up arrow to go to parent class/method
- Direct navigation if single parent
- Menu selection if multiple inheritance

**Child Navigation (↓)**
- Click the blue down arrow to go to child classes/implementations
- Direct navigation if single child
- Menu selection if multiple children

**Bidirectional (↑ ↓)**
- Click anywhere on the arrows
- Choose direction from quick pick menu

## Example

```python
class Animal:
    def speak(self):  # ↓ (has implementations)
        pass

class Dog(Animal):  # ↑ (has parent) ↓ (has children)
    def speak(self):  # ↑ (overrides) ↓ (has implementations)
        return "Woof!"

class Labrador(Dog):  # ↑ (has parent)
    def speak(self):  # ↑ (overrides)
        return "Friendly woof!"
```

## Installation

### From Source

1. Clone the repository
2. Run `npm install`
3. Press `F5` to open Extension Development Host
4. Open a Python file to see navigation icons

### Building VSIX

```bash
npm install
npm run compile
npm run package
```

Install the generated `.vsix` file in VS Code.

## Requirements

- VS Code 1.80.0 or higher
- Python files in your workspace

## Known Limitations

- Only works with Python files in the workspace
- Does not analyze external packages or libraries
- Clicking the same position rapidly may not trigger navigation (50ms cooldown)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
