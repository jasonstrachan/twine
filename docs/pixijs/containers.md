# PixiJS v8 Containers and Display Objects

## Overview

Containers are the fundamental building blocks of the PixiJS display hierarchy. They serve as parents for other display objects and provide transformation, rendering, and interaction capabilities.

## Display Object Hierarchy

```
DisplayObject (base class)
├── Container
│   ├── Sprite
│   ├── Graphics
│   ├── Text
│   ├── BitmapText
│   └── Custom Containers
└── Other Display Objects
```

## Creating Containers

### Basic Container
```javascript
import { Container } from 'pixi.js';

const container = new Container();
app.stage.addChild(container);
```

### Adding Children
```javascript
const container = new Container();
const sprite1 = Sprite.from('image1.png');
const sprite2 = Sprite.from('image2.png');

// Add individual children
container.addChild(sprite1);
container.addChild(sprite2);

// Add multiple children at once
container.addChild(sprite1, sprite2);
```

## Container Properties

### Position and Transform
```javascript
// Position
container.x = 100;
container.y = 50;
container.position.set(100, 50);

// Scale
container.scale.x = 2;
container.scale.y = 1.5;
container.scale.set(2, 1.5);

// Rotation (in radians)
container.rotation = Math.PI / 4; // 45 degrees

// Pivot point
container.pivot.x = 50;
container.pivot.y = 25;
container.pivot.set(50, 25);

// Skew
container.skew.x = 0.1;
container.skew.y = 0.2;
```

### Visibility and Alpha
```javascript
// Visibility
container.visible = true; // or false

// Alpha (transparency)
container.alpha = 0.5; // 50% transparent

// Renderable (affects performance optimization)
container.renderable = true;
```

## Child Management

### Adding Children
```javascript
// Add child
container.addChild(child);

// Add child at specific index
container.addChildAt(child, 0);

// Add multiple children
container.addChild(child1, child2, child3);
```

### Removing Children
```javascript
// Remove specific child
container.removeChild(child);

// Remove child at index
container.removeChildAt(0);

// Remove children in range
container.removeChildren(startIndex, endIndex);

// Remove all children
container.removeChildren();
```

### Finding Children
```javascript
// Get child at index
const child = container.getChildAt(0);

// Get child index
const index = container.getChildIndex(child);

// Check if contains child
const hasChild = container.children.includes(child);

// Find child by property
const foundChild = container.children.find(child => child.name === 'mySprite');
```

## Container Events

### Interaction Events
```javascript
// Make container interactive
container.eventMode = 'static'; // or 'dynamic', 'passive', 'auto'

// Mouse/touch events
container.on('pointerdown', (event) => {
  console.log('Container clicked!', event);
});

container.on('pointerup', (event) => {
  console.log('Container released!', event);
});

container.on('pointermove', (event) => {
  console.log('Mouse/finger moved over container!', event);
});

// Mouse-specific events
container.on('mousedown', onMouseDown);
container.on('mouseup', onMouseUp);
container.on('mousemove', onMouseMove);

// Touch-specific events
container.on('touchstart', onTouchStart);
container.on('touchend', onTouchEnd);
container.on('touchmove', onTouchMove);
```

### Custom Events
```javascript
// Emit custom event
container.emit('customEvent', { data: 'example' });

// Listen for custom event
container.on('customEvent', (data) => {
  console.log('Custom event received:', data);
});
```

## Bounds and Hit Testing

### Getting Bounds
```javascript
// Get local bounds (relative to container)
const localBounds = container.getLocalBounds();

// Get global bounds (in stage coordinates)
const globalBounds = container.getBounds();

// Bounds properties
console.log(localBounds.x, localBounds.y);
console.log(localBounds.width, localBounds.height);
```

### Hit Testing
```javascript
// Check if point is inside container
const point = { x: 100, y: 50 };
const isInside = container.containsPoint(point);

// Hit test with recursion
const hitChild = container.hitTest(point);
```

## Container Culling

### Culling Rectangle
```javascript
// Set culling area for performance
container.cullArea = new Rectangle(0, 0, 800, 600);

// Enable/disable culling
container.cullable = true;
```

## Sorting and Z-Index

### Manual Sorting
```javascript
// Sort children by zIndex
container.sortableChildren = true;

// Set child z-index
child1.zIndex = 1;
child2.zIndex = 2;
child3.zIndex = 0;

// Children will render in z-index order: child3, child1, child2
```

### Swapping Children
```javascript
// Swap children positions
container.swapChildren(child1, child2);
```

## Advanced Container Usage

### Custom Container Class
```javascript
class GameScene extends Container {
  constructor() {
    super();
    this.setup();
  }

  setup() {
    // Initialize scene elements
    this.background = Sprite.from('background.png');
    this.addChild(this.background);

    // Add game objects
    this.setupGameObjects();
  }

  setupGameObjects() {
    // Custom setup logic
  }

  update(delta) {
    // Update logic for all children
    this.children.forEach(child => {
      if (child.update) {
        child.update(delta);
      }
    });
  }
}
```

### Container as Mask
```javascript
// Create mask container
const maskContainer = new Container();
const maskShape = new Graphics()
  .circle(100, 100, 50)
  .fill(0xffffff);
maskContainer.addChild(maskShape);

// Apply mask to target container
targetContainer.mask = maskContainer;
```

## Performance Tips

1. **Use `cullArea`** for containers with many children
2. **Set `sortableChildren = false`** if z-ordering isn't needed
3. **Use `eventMode = 'passive'`** for non-interactive containers
4. **Remove unused children** to free memory
5. **Batch transformations** when possible

## Common Patterns

### Scene Management
```javascript
class SceneManager extends Container {
  constructor() {
    super();
    this.scenes = new Map();
    this.currentScene = null;
  }

  addScene(name, scene) {
    this.scenes.set(name, scene);
    scene.visible = false;
    this.addChild(scene);
  }

  showScene(name) {
    if (this.currentScene) {
      this.currentScene.visible = false;
    }
    
    const scene = this.scenes.get(name);
    if (scene) {
      scene.visible = true;
      this.currentScene = scene;
    }
  }
}
```

### Layer Management
```javascript
// Create separate layers for different content types
const backgroundLayer = new Container();
const gameLayer = new Container();
const uiLayer = new Container();

backgroundLayer.zIndex = 0;
gameLayer.zIndex = 1;
uiLayer.zIndex = 2;

app.stage.sortableChildren = true;
app.stage.addChild(backgroundLayer, gameLayer, uiLayer);
```