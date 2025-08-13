# PixiJS v8 Quick Start Guide

## Prerequisites
- Familiarity with command line and JavaScript
- Node.js v20.0 or higher installed

## Creating a New Project

### Installation Method
Run the following command in your terminal:

```bash
npm create pixi.js@latest
```

### Project Setup Options
Two main template types:
1. **Creation Templates** (Recommended)
   - Tailored for specific platforms
   - Includes additional configurations
   - Great for beginners

2. **Bundler Templates**
   - General project scaffolding
   - Flexible project structure
   - Recommended: Vite + PixiJS template

### Post-Installation Steps
```bash
cd <your-project-name>
npm install
npm run dev
```

### Alternative Installation
For existing projects:
```bash
npm install pixi.js
```

## Basic Usage Example

```javascript
import { Application, Sprite } from 'pixi.js';

async function initializePixiApp() {
  // Create application
  const app = new Application();
  await app.init({ background: '#1099bb', width: 800, height: 600 });
  document.body.appendChild(app.canvas);

  // Create a sprite
  const sprite = Sprite.from('path/to/image.png');
  app.stage.addChild(sprite);
}
```

## Application Initialization

### Async Initialization (v8 Required)
```javascript
const app = new Application();
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});
```

### Configuration Options
- `width`: Canvas width in pixels
- `height`: Canvas height in pixels
- `backgroundColor`: Background color (hex)
- `resolution`: Device pixel ratio
- `autoDensity`: Auto-adjust for high DPI displays

## Important Notes
- For Vite projects, wrap code in an async function
- Be aware of potential build issues with top-level await
- Always use async/await for app initialization in v8

## Quick Start Resources
- [PixiJS Playground](/8.x/playground)
- [Full Documentation](/8.x/guides)