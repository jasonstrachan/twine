# PixiJS v8 Documentation

This directory contains comprehensive documentation for PixiJS v8, covering migration, core concepts, and API changes.

## Documentation Files

### 🚀 [Getting Started](./getting-started.md)
- Installation methods
- Project setup options
- Basic usage examples
- Application initialization

### 📋 [Migration Guide v8](./migration-guide-v8.md)
- Breaking changes from v7 to v8
- New package structure
- Async initialization requirements
- Texture system updates

### 🎨 [Graphics API](./graphics-api.md)
- Complete Graphics API overhaul
- New drawing methods and patterns
- Styling and stroke options
- Migration from v7 patterns

### 📦 [Containers and Display Objects](./containers.md)
- Container hierarchy and management
- Transform properties and methods
- Event handling and interaction
- Performance optimization tips

### 🖼️ [Assets and Textures](./assets-and-textures.md)
- Modern Assets loading system
- Texture management and creation
- Sprite sheets and bitmap fonts
- Performance optimization strategies

### ⚡ [Events System](./events-system.md)
- New eventMode system (replaces interactive)
- Mouse, touch, and pointer events
- Event bubbling and delegation
- Performance optimization and best practices

## Quick Reference

### Key v8 Changes
1. **Async Initialization**: All apps must use `await app.init()`
2. **Unified Package**: Import everything from `'pixi.js'`
3. **New Graphics API**: Replace `beginFill()`/`endFill()` with shape methods + `fill()`
4. **Assets System**: Promise-based loading with built-in caching

### Basic v8 Setup
```javascript
import { Application, Sprite, Graphics } from 'pixi.js';

async function setupPixi() {
  const app = new Application();
  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb
  });
  
  document.body.appendChild(app.canvas);
  
  // Your PixiJS code here
}

setupPixi();
```

### Common Patterns

#### Loading Assets
```javascript
import { Assets } from 'pixi.js';

// Load single asset
const texture = await Assets.load('image.png');

// Load multiple with aliases
await Assets.load([
  { alias: 'hero', src: 'hero.png' },
  { alias: 'enemy', src: 'enemy.png' }
]);
```

#### Creating Graphics
```javascript
const graphics = new Graphics()
  .rect(50, 50, 100, 100)
  .fill(0xff0000)
  .circle(200, 100, 50)
  .fill(0x00ff00);
```

#### Container Management
```javascript
const container = new Container();
container.addChild(sprite1, sprite2);
container.position.set(100, 50);
app.stage.addChild(container);
```

## Additional Resources

- [Official PixiJS v8 Documentation](https://pixijs.com/8.x/)
- [PixiJS GitHub Repository](https://github.com/pixijs/pixijs)
- [Community Examples and Tutorials](https://pixijs.com/8.x/examples)
- [Migration Tools and Utilities](https://github.com/pixijs/pixijs/tree/main/tools)

## Contributing

This documentation is part of the Twine project. If you find errors or want to add more examples, please update the relevant markdown files in this directory.