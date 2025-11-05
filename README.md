# Python Class Navigator

A VS Code extension that brings PyCharm-like class and method navigation to Python development. Navigate seamlessly between parent and child classes, overridden methods, and implementations with visual indicators and one-click navigation.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/your-username/python-class-navigator)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

### Visual Navigation Indicators

Colorful inline arrows appear next to your code:

- **↑** (Green) - Navigate to parent class or overridden method
- **↓** (Blue) - Navigate to child classes or method implementations
- **↑ ↓** (Both) - Element has both parent and children (bidirectional navigation)

### Intelligent Navigation

- **One-Click Navigation**: Click arrow icons to jump instantly
- **Smart Detection**: Automatically detects class hierarchies and method overrides
- **Cross-File Support**: Works across multiple files in your workspace
- **Quick Pick Menus**: Choose from multiple targets when available

### CodeLens Integration

Clickable links above declarations provide alternative navigation:
- "Go to parent class/method"
- "Go to implementations"
- "View X implementation(s)"

## 🚀 Quick Start

1. **Install** the extension
2. **Open** any Python file
3. **Look** for colored arrows (↑ ↓) next to classes and methods
4. **Click** an arrow to navigate

## 📖 Usage Guide

### Class Navigation

Navigate through your class hierarchies effortlessly:

```python
class Animal:           # ↓ (has child classes)
    pass

class Dog(Animal):      # ↑ (has parent) ↓ (has children)
    pass

class Labrador(Dog):    # ↑ (has parent)
    pass
```

**Click behavior:**
- **↑** on `Dog` → jumps to `Animal`
- **↓** on `Dog` → shows menu to choose between `Labrador` and other children
- **↓** on `Animal` → shows all child classes

### Method Navigation

Track method overrides and implementations:

```python
class Animal:
    def speak(self):    # ↓ (has implementations)
        pass

class Dog(Animal):
    def speak(self):    # ↑ (overrides) ↓ (has implementations)
        return "Woof!"

class Labrador(Dog):
    def speak(self):    # ↑ (overrides parent)
        return "Friendly woof!"
```

**Click behavior:**
- **↑** on `Dog.speak` → jumps to `Animal.speak`
- **↓** on `Dog.speak` → shows child implementations
- Click on both arrows → choose direction (up or down)

### Bidirectional Navigation

When both arrows appear (↑ ↓):
1. Click anywhere on the arrows
2. Quick pick menu appears
3. Choose:
   - `↑ Go to parent` - Navigate up the hierarchy
   - `↓ Go to children` - Navigate down the hierarchy

## 🎯 Key Features

- ✅ **Instant navigation** between related code
- ✅ **Visual indicators** show relationships at a glance
- ✅ **Multiple inheritance** support
- ✅ **Cross-file navigation** within workspace
- ✅ **Smart debouncing** prevents navigation loops
- ✅ **CodeLens integration** for alternative navigation
- ✅ **Hover tooltips** show target information

## 📋 Requirements

- **VS Code**: Version 1.80.0 or higher
- **Workspace**: Python files must be in the workspace
- **File Type**: Only works with `.py` files

## ⚙️ Installation

### From Marketplace (Coming Soon)

```
ext install python-class-navigator
```

### From Source

```bash
git clone https://github.com/your-username/python-class-navigator
cd python-class-navigator
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host.

### From VSIX

```bash
npm run package
code --install-extension python-class-navigator-0.0.1.vsix
```

## 🔧 Configuration

No configuration needed! The extension works out of the box.

## ⚠️ Known Limitations

- **Workspace Only**: Does not analyze external packages or libraries
- **Click Debouncing**: 50ms cooldown between navigations to prevent event loops
- **Same Position Clicks**: Due to VS Code API limitations, clicking the exact same position twice may require moving the cursor first

### Workaround for Repeat Clicks

If clicking the same arrow doesn't work:
1. Click elsewhere in the editor first
2. Wait ~50ms before clicking again
3. Use keyboard to move cursor, then click
4. Use CodeLens as alternative navigation

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## 📄 License

[MIT](LICENSE)

## 🐛 Issues & Feedback

Found a bug or have a suggestion? [Open an issue](https://github.com/your-username/python-class-navigator/issues)

## 🌟 Credits

Inspired by PyCharm's navigation features.

---

**Made with ❤️ for Python developers**
