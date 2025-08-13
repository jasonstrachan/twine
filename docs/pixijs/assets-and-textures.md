# PixiJS v8 Assets and Texture Loading

## Overview

PixiJS v8 introduces a modern Assets system that provides a Promise-based asset management solution with built-in caching, asynchronous loading, and support for multiple file types.

## Key Features

- Asynchronous loading with Promises
- Built-in caching mechanism
- Support for multiple file types
- Custom parser flexibility
- Background loading capabilities
- Manifest-based asset bundles

## Basic Asset Loading

### Simple Loading
```javascript
import { Assets } from 'pixi.js';

// Load a single texture
const texture = await Assets.load('path/to/hero.png');
const sprite = new Sprite(texture);

// Load multiple assets
const textures = await Assets.load([
  'path/to/bunny.png', 
  'path/to/cat.png'
]);
```

### Using Aliases
```javascript
// Load with alias for easier reference
await Assets.load({ 
  alias: 'bunny', 
  src: 'path/to/bunny.png' 
});

// Retrieve using alias
const bunnyTexture = Assets.get('bunny');
const bunnySprite = new Sprite(bunnyTexture);
```

### Multiple Assets with Aliases
```javascript
const assetsToLoad = [
  { alias: 'background', src: 'images/background.jpg' },
  { alias: 'hero', src: 'images/hero.png' },
  { alias: 'enemy', src: 'images/enemy.png' }
];

await Assets.load(assetsToLoad);

// Use loaded assets
const bg = new Sprite(Assets.get('background'));
const hero = new Sprite(Assets.get('hero'));
const enemy = new Sprite(Assets.get('enemy'));
```

## Supported File Types

### Texture Formats
- **Images**: `.png`, `.jpg`, `.gif`, `.webp`, `.svg`
- **Video Textures**: `.mp4`, `.webm`
- **Compressed Textures**: `.ktx`, `.dds`

### Data Formats
- **Sprite Sheets**: `.json` (TexturePacker format)
- **Bitmap Fonts**: `.fnt`
- **Web Fonts**: `.ttf`, `.woff`, `.woff2`
- **Audio**: `.mp3`, `.wav`, `.ogg`
- **JSON Data**: `.json`

## Asset Management

### Retrieving Assets
```javascript
// Get a previously loaded asset by URL
const texture = Assets.get('path/to/bunny.png');

// Get asset by alias
const texture = Assets.get('bunny');

// Check if asset exists
if (Assets.cache.has('bunny')) {
  const texture = Assets.get('bunny');
}
```

### Unloading Assets
```javascript
// Unload single asset
await Assets.unload('path/to/bunny.png');

// Unload multiple assets
await Assets.unload(['bunny', 'cat', 'hero']);

// Unload all assets (use with caution)
await Assets.unload(Assets.cache.keys());
```

## Asset Initialization

### Global Configuration
```javascript
import { Assets } from 'pixi.js';

await Assets.init({
  basePath: '/assets/',           // Set base path for all assets
  defaultSearchParams: 'v=1.0',  // Add version parameter
  preferWorkers: true,            // Use web workers when possible
  crossOrigin: 'anonymous'        // CORS settings
});
```

## Advanced Loading Patterns

### Background Loading
```javascript
// Start loading in background
const loadPromise = Assets.load(['level1.json', 'level2.json']);

// Do other initialization...

// Wait for assets when needed
const assets = await loadPromise;
```

### Progress Tracking
```javascript
const assets = [
  'background.jpg',
  'sprites.json',
  'sounds.mp3'
];

Assets.load(assets, (progress) => {
  console.log(`Loading: ${Math.round(progress * 100)}%`);
});
```

### Error Handling
```javascript
try {
  const texture = await Assets.load('path/to/image.png');
} catch (error) {
  console.error('Failed to load asset:', error);
  // Use fallback texture
  const fallback = Assets.get('fallback-texture');
}
```

## Texture Creation and Management

### Creating Textures from Sources
```javascript
// From HTMLImageElement
const img = new Image();
img.src = 'path/to/image.png';
await img.decode();
const texture = Texture.from(img);

// From Canvas
const canvas = document.createElement('canvas');
// ... draw on canvas
const texture = Texture.from(canvas);

// From Video
const video = document.createElement('video');
video.src = 'path/to/video.mp4';
const texture = Texture.from(video);
```

### Texture Options
```javascript
const texture = await Assets.load({
  src: 'image.png',
  data: {
    scaleMode: 'nearest',     // or 'linear'
    wrapMode: 'repeat',       // or 'clamp', 'mirror'
    resolution: 2,            // for high-DPI displays
    format: 'rgba8unorm'      // texture format
  }
});
```

## Sprite Sheets

### Loading Sprite Sheets
```javascript
// Load sprite sheet (JSON + PNG)
await Assets.load('spritesheet.json');

// Access individual frames
const frame1 = Assets.get('frame1.png');
const frame2 = Assets.get('frame2.png');

// Create animated sprite
const frames = [
  Assets.get('walk1.png'),
  Assets.get('walk2.png'),
  Assets.get('walk3.png')
];
const animatedSprite = new AnimatedSprite(frames);
```

## Bitmap Fonts

### Loading and Using Bitmap Fonts
```javascript
// Load bitmap font
await Assets.load('myFont.fnt');

// Use in BitmapText
const text = new BitmapText({
  text: 'Hello World!',
  style: {
    fontFamily: 'MyFont',
    fontSize: 24,
    fill: 0xffffff
  }
});
```

## Asset Bundles and Manifests

### Manifest Structure
```javascript
const manifest = {
  bundles: [
    {
      name: 'game-screen',
      assets: [
        { alias: 'background', src: 'game-bg.png' },
        { alias: 'player', src: 'player.json' },
        { alias: 'enemies', src: 'enemies.json' }
      ]
    },
    {
      name: 'menu-screen',
      assets: [
        { alias: 'menu-bg', src: 'menu-bg.png' },
        { alias: 'buttons', src: 'ui-elements.json' }
      ]
    }
  ]
};

// Initialize with manifest
await Assets.init({ manifest });
```

### Loading Bundles
```javascript
// Load entire bundle
await Assets.loadBundle('game-screen');

// Load multiple bundles
await Assets.loadBundle(['game-screen', 'menu-screen']);

// Background load bundle
Assets.backgroundLoadBundle('next-level');
```

## Performance Optimization

### Preloading Strategy
```javascript
// Essential assets first
await Assets.load([
  'loading-screen.png',
  'progress-bar.png'
]);

// Show loading screen
showLoadingScreen();

// Load game assets in background
const gameAssets = Assets.loadBundle('game-assets');

// Update progress
gameAssets.then(() => {
  hideLoadingScreen();
  startGame();
});
```

### Memory Management
```javascript
// Unload assets when changing scenes
async function changeScene(newScene) {
  // Unload previous scene assets
  await Assets.unload('previous-scene');
  
  // Load new scene assets
  await Assets.loadBundle(newScene);
  
  // Initialize new scene
  initializeScene(newScene);
}
```

### Texture Atlas Optimization
```javascript
// Use texture atlases to reduce draw calls
await Assets.load('ui-atlas.json');

// All UI elements now share one texture
const button = new Sprite(Assets.get('button.png'));
const icon = new Sprite(Assets.get('icon.png'));
```

## Error Handling and Fallbacks

### Robust Loading
```javascript
async function loadWithFallback(primary, fallback) {
  try {
    return await Assets.load(primary);
  } catch (error) {
    console.warn(`Failed to load ${primary}, using fallback`);
    return await Assets.load(fallback);
  }
}

// Usage
const texture = await loadWithFallback(
  'high-res-image.png',
  'low-res-image.png'
);
```

### Conditional Loading
```javascript
// Load different assets based on device capabilities
const isMobile = /Mobi/i.test(navigator.userAgent);
const isHighDPI = window.devicePixelRatio > 1;

const assetsToLoad = [
  {
    alias: 'background',
    src: isMobile 
      ? 'bg-mobile.jpg' 
      : isHighDPI 
        ? 'bg-desktop@2x.jpg' 
        : 'bg-desktop.jpg'
  }
];

await Assets.load(assetsToLoad);
```

## Migration from v7

### Old Pattern (v7)
```javascript
// v7 Loader
const loader = new Loader();
loader.add('bunny', 'bunny.png');
loader.load((loader, resources) => {
  const bunny = new Sprite(resources.bunny.texture);
});
```

### New Pattern (v8)
```javascript
// v8 Assets
const texture = await Assets.load('bunny.png');
const bunny = new Sprite(texture);
```

## Best Practices

1. **Use aliases** for better code maintainability
2. **Load assets asynchronously** to avoid blocking
3. **Implement proper error handling** with fallbacks
4. **Unload unused assets** to manage memory
5. **Use texture atlases** for better performance
6. **Preload critical assets** before showing content
7. **Consider device capabilities** when choosing asset quality