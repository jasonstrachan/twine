# PixiJS v8 Migration Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Breaking Changes](#breaking-changes)
3. [Deprecated Features](#deprecated-features)
4. [Resources](#resources)

## 1. Introduction

PixiJS v8 introduces significant performance improvements and architectural changes. This guide helps developers smoothly transition from v7 to v8.

## 2. Breaking Changes

### Should I Upgrade?

Consider upgrading if:
- Your project doesn't rely on libraries not yet migrated to v8
- You want improved renderer performance

### New Package Structure

**Old:**
```javascript
import { Application } from '@pixi/app';
import { Sprite } from '@pixi/sprite';
```

**New:**
```javascript
import { Application, Sprite } from 'pixi.js';
```

### Async Initialization

**Old:**
```javascript
const app = new Application();
// do pixi things
```

**New:**
```javascript
const app = new Application();
(async () => {
  await app.init({
    // application options
  });
  // do pixi things
})();
```

### Texture Adjustments

PixiJS v8 introduces new texture sources:
- `TextureSource`
- `ImageSource`
- `CanvasSource`
- `VideoSource`
- `BufferSource`
- `CompressedSource`

**Example:**
```javascript
const image = new Image();
image.onload = function() {
  const source = new ImageSource({
    resource: image,
  });
  const texture = new Texture({ source });
}
```

### Graphics API Overhaul

**Old:**
```javascript
const graphics = new Graphics()
  .beginFill(0xff0000)
  .drawRect(50, 50, 100, 100)
  .endFill();
```

**New:**
```javascript
const graphics = new Graphics()
  .rect(50, 50, 100, 100)
  .fill(0xff0000);
```

## 3. Deprecated Features

Several features have been deprecated or removed in v8. Check the official documentation for complete details.

## 4. Resources

- Official PixiJS v8 Documentation
- Community Migration Examples
- Breaking Changes Detailed List