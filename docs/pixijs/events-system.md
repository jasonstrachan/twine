# PixiJS v8 Event System

## Overview

PixiJS v8 introduces significant improvements to the event system, with better performance, more intuitive APIs, and enhanced interaction capabilities.

## Key Changes from v7

### Event Mode (New in v8)
The `interactive` property has been replaced with `eventMode`:

```javascript
// v7 (deprecated)
sprite.interactive = true;

// v8 (new)
sprite.eventMode = 'static'; // or 'dynamic', 'passive', 'auto'
```

### Event Mode Options

- **`'static'`**: Object receives events, bounds calculated once
- **`'dynamic'`**: Object receives events, bounds calculated every frame
- **`'passive'`**: Object doesn't receive events but children can
- **`'auto'`**: Automatically determined based on event listeners

## Basic Event Handling

### Mouse/Pointer Events
```javascript
import { Sprite } from 'pixi.js';

const sprite = Sprite.from('button.png');
sprite.eventMode = 'static';

// Pointer events (works for both mouse and touch)
sprite.on('pointerdown', (event) => {
  console.log('Pressed!', event.global.x, event.global.y);
});

sprite.on('pointerup', (event) => {
  console.log('Released!', event);
});

sprite.on('pointermove', (event) => {
  console.log('Moved!', event.global);
});

sprite.on('pointerover', (event) => {
  console.log('Mouse entered!');
});

sprite.on('pointerout', (event) => {
  console.log('Mouse left!');
});
```

### Mouse-Specific Events
```javascript
// Mouse-only events
sprite.on('mousedown', onMouseDown);
sprite.on('mouseup', onMouseUp);
sprite.on('mousemove', onMouseMove);
sprite.on('mouseenter', onMouseEnter);
sprite.on('mouseleave', onMouseLeave);
sprite.on('wheel', onMouseWheel);

function onMouseDown(event) {
  console.log('Mouse button pressed:', event.button);
  // event.button: 0 = left, 1 = middle, 2 = right
}
```

### Touch-Specific Events
```javascript
// Touch-only events
sprite.on('touchstart', onTouchStart);
sprite.on('touchend', onTouchEnd);
sprite.on('touchmove', onTouchMove);
sprite.on('touchcancel', onTouchCancel);

function onTouchStart(event) {
  console.log('Touch started:', event.touches);
  // Access multiple touch points
  event.touches.forEach((touch, index) => {
    console.log(`Touch ${index}:`, touch.global);
  });
}
```

## Event Object Properties

### Common Properties
```javascript
sprite.on('pointerdown', (event) => {
  // Position information
  console.log('Global position:', event.global.x, event.global.y);
  console.log('Local position:', event.local.x, event.local.y);
  
  // Target information
  console.log('Current target:', event.currentTarget);
  console.log('Original target:', event.target);
  
  // Event metadata
  console.log('Event type:', event.type);
  console.log('Timestamp:', event.timeStamp);
  
  // Prevent default behavior
  event.preventDefault();
  
  // Stop event propagation
  event.stopPropagation();
});
```

### Mouse-Specific Properties
```javascript
sprite.on('mousedown', (event) => {
  console.log('Button pressed:', event.button);
  console.log('Buttons state:', event.buttons);
  console.log('Alt key:', event.altKey);
  console.log('Ctrl key:', event.ctrlKey);
  console.log('Shift key:', event.shiftKey);
  console.log('Meta key:', event.metaKey);
});
```

## Advanced Event Handling

### Event Bubbling and Capturing
```javascript
// Parent container
const container = new Container();
container.eventMode = 'static';

// Child sprite
const sprite = new Sprite();
sprite.eventMode = 'static';
container.addChild(sprite);

// Event bubbling (default)
container.on('pointerdown', (event) => {
  console.log('Container received bubbled event');
});

sprite.on('pointerdown', (event) => {
  console.log('Sprite received event first');
  // event.stopPropagation(); // Prevents bubbling
});
```

### Event Delegation
```javascript
// Handle events on parent for multiple children
const buttonContainer = new Container();
buttonContainer.eventMode = 'static';

buttonContainer.on('pointerdown', (event) => {
  const clickedButton = event.target;
  if (clickedButton.name?.startsWith('button-')) {
    handleButtonClick(clickedButton.name);
  }
});

// Add multiple buttons
for (let i = 0; i < 5; i++) {
  const button = Sprite.from('button.png');
  button.name = `button-${i}`;
  button.eventMode = 'static';
  buttonContainer.addChild(button);
}
```

### Custom Events
```javascript
// Emit custom events
sprite.emit('customEvent', { data: 'example' });

// Listen for custom events
sprite.on('customEvent', (data) => {
  console.log('Custom event received:', data);
});

// Remove event listeners
sprite.off('customEvent');

// One-time event listeners
sprite.once('customEvent', handler);
```

## Hit Testing and Bounds

### Custom Hit Areas
```javascript
import { Rectangle, Polygon } from 'pixi.js';

// Rectangular hit area
sprite.hitArea = new Rectangle(0, 0, 100, 50);

// Polygonal hit area
const triangle = new Polygon([0, 0, 50, 0, 25, 50]);
sprite.hitArea = triangle;

// Circular hit area (using polygon approximation)
function createCircleHitArea(radius, segments = 16) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    );
  }
  return new Polygon(points);
}

sprite.hitArea = createCircleHitArea(50);
```

### Manual Hit Testing
```javascript
// Test if point intersects with display object
const point = { x: 100, y: 100 };
const hit = sprite.containsPoint(point);

// Get the topmost child at point
const hitChild = container.hitTest(point);
```

## Performance Optimization

### Cursor Changes
```javascript
// Change cursor on hover
sprite.cursor = 'pointer';

// Dynamic cursor changes
sprite.on('pointerover', () => {
  sprite.cursor = 'pointer';
});

sprite.on('pointerout', () => {
  sprite.cursor = 'default';
});
```

### Event Mode Optimization
```javascript
// For static objects that don't move
staticSprite.eventMode = 'static';

// For objects that move frequently
movingSprite.eventMode = 'dynamic';

// For containers that don't need events but children do
parentContainer.eventMode = 'passive';

// Let PixiJS decide automatically
autoSprite.eventMode = 'auto';
```

### Disable Events When Not Needed
```javascript
// Temporarily disable events
sprite.eventMode = 'none';

// Re-enable when needed
sprite.eventMode = 'static';
```

## Common Patterns

### Button Implementation
```javascript
class Button extends Sprite {
  constructor(texture, onClick) {
    super(texture);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.onClick = onClick;
    
    this.on('pointerdown', this.onPress.bind(this));
    this.on('pointerup', this.onRelease.bind(this));
    this.on('pointerover', this.onHover.bind(this));
    this.on('pointerout', this.onOut.bind(this));
  }
  
  onPress() {
    this.scale.set(0.95);
  }
  
  onRelease() {
    this.scale.set(1);
    this.onClick?.();
  }
  
  onHover() {
    this.tint = 0xcccccc;
  }
  
  onOut() {
    this.tint = 0xffffff;
    this.scale.set(1); // Reset scale in case pointer left during press
  }
}
```

### Drag and Drop
```javascript
class DraggableSprite extends Sprite {
  constructor(texture) {
    super(texture);
    this.eventMode = 'static';
    this.cursor = 'move';
    
    this.dragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.on('pointerdown', this.startDrag.bind(this));
    this.on('pointermove', this.drag.bind(this));
    this.on('pointerup', this.stopDrag.bind(this));
    this.on('pointerupoutside', this.stopDrag.bind(this));
  }
  
  startDrag(event) {
    this.dragging = true;
    this.dragOffset.x = event.global.x - this.x;
    this.dragOffset.y = event.global.y - this.y;
  }
  
  drag(event) {
    if (this.dragging) {
      this.x = event.global.x - this.dragOffset.x;
      this.y = event.global.y - this.dragOffset.y;
    }
  }
  
  stopDrag() {
    this.dragging = false;
  }
}
```

### Hover Effects
```javascript
function addHoverEffect(sprite, hoverScale = 1.1) {
  sprite.eventMode = 'static';
  
  sprite.on('pointerover', () => {
    // Smooth scale animation
    gsap.to(sprite.scale, {
      x: hoverScale,
      y: hoverScale,
      duration: 0.2,
      ease: "power2.out"
    });
  });
  
  sprite.on('pointerout', () => {
    gsap.to(sprite.scale, {
      x: 1,
      y: 1,
      duration: 0.2,
      ease: "power2.out"
    });
  });
}
```

## Event System Migration

### v7 to v8 Changes
```javascript
// v7 Pattern
sprite.interactive = true;
sprite.buttonMode = true;
sprite.on('click', handler);
sprite.on('tap', handler); // Mobile

// v8 Pattern
sprite.eventMode = 'static';
sprite.cursor = 'pointer';
sprite.on('pointerdown', handler); // Works for both mouse and touch
```

### Interaction Manager (Removed in v8)
```javascript
// v7 - Manual interaction manager access
app.renderer.plugins.interaction.mapPositionToPoint(global, point);

// v8 - Use event object properties directly
sprite.on('pointerdown', (event) => {
  const global = event.global;
  const local = event.local;
});
```

## Best Practices

1. **Use `eventMode` appropriately** for performance
2. **Prefer `pointer` events** over mouse/touch for cross-platform compatibility
3. **Use `event.stopPropagation()`** to prevent unwanted event bubbling
4. **Set `cursor` property** for better UX
5. **Use `once()`** for one-time event listeners
6. **Clean up event listeners** when objects are destroyed
7. **Use custom hit areas** for better user experience
8. **Consider event delegation** for many similar objects

## Debugging Events

### Event Debugging
```javascript
// Log all events on an object
const originalEmit = sprite.emit;
sprite.emit = function(event, ...args) {
  console.log(`Event emitted: ${event}`, args);
  return originalEmit.call(this, event, ...args);
};

// Visualize hit areas (development only)
if (process.env.NODE_ENV === 'development') {
  const debugGraphics = new Graphics()
    .rect(sprite.hitArea.x, sprite.hitArea.y, sprite.hitArea.width, sprite.hitArea.height)
    .stroke({ color: 0xff0000, width: 1 });
  sprite.addChild(debugGraphics);
}
```