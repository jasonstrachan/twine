# PixiJS v8 Graphics API Documentation

## Overview

The Graphics API in PixiJS v8 has been completely redesigned with a new, more intuitive API that replaces the old `beginFill()` and `endFill()` pattern.

## Major Changes from v7

### Old v7 Pattern
```javascript
const graphics = new Graphics()
  .beginFill(0xff0000)
  .drawRect(50, 50, 100, 100)
  .endFill()
  .beginFill(0x00ff00)
  .drawCircle(150, 150, 50)
  .endFill();
```

### New v8 Pattern
```javascript
const graphics = new Graphics()
  .rect(50, 50, 100, 100)
  .fill(0xff0000)
  .circle(150, 150, 50)
  .fill(0x00ff00);
```

## Basic Shapes

### Rectangle
```javascript
graphics.rect(x, y, width, height);
graphics.fill(color); // or .stroke(color)
```

### Circle
```javascript
graphics.circle(x, y, radius);
graphics.fill(color);
```

### Rounded Rectangle
```javascript
graphics.roundRect(x, y, width, height, radius);
graphics.fill(color);
```

### Ellipse
```javascript
graphics.ellipse(x, y, radiusX, radiusY);
graphics.fill(color);
```

### Polygon
```javascript
graphics.poly([x1, y1, x2, y2, x3, y3, ...]);
graphics.fill(color);
```

## Styling Methods

### Fill
```javascript
// Solid color
graphics.fill(0xff0000);

// With alpha
graphics.fill({ color: 0xff0000, alpha: 0.5 });

// Gradient (if supported)
graphics.fill({
  type: 'linear',
  x0: 0, y0: 0, x1: 100, y1: 100,
  colorStops: [
    { offset: 0, color: 0xff0000 },
    { offset: 1, color: 0x0000ff }
  ]
});
```

### Stroke
```javascript
// Basic stroke
graphics.stroke({ color: 0x000000, width: 2 });

// Advanced stroke options
graphics.stroke({
  color: 0x000000,
  width: 3,
  alignment: 0.5, // 0 = inner, 0.5 = center, 1 = outer
  cap: 'round',   // 'butt', 'round', 'square'
  join: 'round'   // 'miter', 'round', 'bevel'
});
```

## Complex Paths

### MoveTo and LineTo
```javascript
graphics
  .moveTo(50, 50)
  .lineTo(100, 100)
  .lineTo(150, 50)
  .stroke({ color: 0x000000, width: 2 });
```

### Bezier Curves
```javascript
// Quadratic curve
graphics
  .moveTo(50, 50)
  .quadraticCurveTo(100, 25, 150, 50)
  .stroke({ color: 0x000000, width: 2 });

// Cubic curve
graphics
  .moveTo(50, 50)
  .bezierCurveTo(75, 25, 125, 25, 150, 50)
  .stroke({ color: 0x000000, width: 2 });
```

### Arcs
```javascript
graphics
  .arc(100, 100, 50, 0, Math.PI)
  .stroke({ color: 0x000000, width: 2 });
```

## Method Chaining

The new API supports fluent method chaining:

```javascript
const graphics = new Graphics()
  .rect(10, 10, 50, 50)
  .fill(0xff0000)
  .rect(70, 10, 50, 50)
  .fill(0x00ff00)
  .circle(100, 100, 25)
  .fill(0x0000ff);
```

## Performance Considerations

### Batching
- Use method chaining for better performance
- Group similar drawing operations together
- Avoid unnecessary `clear()` calls

### Memory Management
```javascript
// Clear graphics when no longer needed
graphics.clear();

// Destroy graphics object
graphics.destroy();
```

## Examples

### Complete Shape with Fill and Stroke
```javascript
const graphics = new Graphics()
  .rect(50, 50, 100, 100)
  .fill(0xff0000)
  .stroke({ color: 0x000000, width: 3 });
```

### Complex Path
```javascript
const graphics = new Graphics()
  .moveTo(50, 50)
  .lineTo(100, 25)
  .lineTo(150, 50)
  .lineTo(125, 100)
  .lineTo(75, 100)
  .closePath()
  .fill(0x00ff00)
  .stroke({ color: 0x000000, width: 2 });
```

## Migration Tips

1. Replace `beginFill()` with shape methods followed by `fill()`
2. Replace `endFill()` calls - they're no longer needed
3. Use `stroke()` method for outlines instead of `lineStyle()`
4. Method chaining is encouraged for cleaner code
5. The new API is more declarative and intuitive