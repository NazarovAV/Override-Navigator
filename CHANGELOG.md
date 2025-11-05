# Changelog

All notable changes to the Python Class Navigator extension.

## [0.0.1] - 2024

### Added

#### Visual Features
- Inline navigation arrows (↑ ↓) for classes and methods
- Color-coded arrows: green for parent, blue for children
- Hover tooltips showing navigation targets
- CodeLens integration with clickable links

#### Navigation Features
- Click-to-navigate on inline arrows
- Direct navigation when single target exists
- Quick pick menu for multiple targets
- Bidirectional navigation with direction choice menu
- Cross-file navigation within workspace

#### Class Navigation
- Navigate to parent classes
- Navigate to child classes
- Support for multiple inheritance
- Automatic detection of class hierarchy

#### Method Navigation
- Navigate to parent (overridden) methods
- Navigate to child method implementations
- Automatic detection of method overrides
- Cross-class method navigation

### Technical

#### Architecture
- TypeScript implementation with full type safety
- Modular code structure with clear separation of concerns
- Efficient Python AST parsing using regex
- Smart decoration management

#### Performance
- Navigation cooldown (50ms) to prevent event loops
- Efficient document parsing
- Minimal performance impact

### Fixed
- Navigation event loop prevention
- Rapid click handling
- Multiple inheritance support
