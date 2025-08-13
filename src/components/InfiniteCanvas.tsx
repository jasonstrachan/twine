import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useCanvasStore } from '../stores/canvasStore';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const { setViewport, updateMouseWorldPos, updateZoom } = useCanvasStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create PIXI application
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add canvas to DOM
    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Create viewport
    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 10000,
      worldHeight: 10000,
      interaction: app.renderer.plugins.interaction,
    });

    // Add viewport to stage
    app.stage.addChild(viewport as any);
    viewportRef.current = viewport;
    setViewport(viewport);

    // Enable pan and zoom
    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate();

    // Track mouse position
    app.view.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = (app.view as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = viewport.toWorld(x, y);
      updateMouseWorldPos(worldPos.x, worldPos.y);
    });

    // Track zoom changes
    viewport.on('zoomed', () => {
      updateZoom(viewport.scale.x);
    });

    // Add a grid for visual reference
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x333333, 0.5);
    
    // Draw grid lines
    for (let i = -5000; i <= 5000; i += 100) {
      grid.moveTo(i, -5000);
      grid.lineTo(i, 5000);
      grid.moveTo(-5000, i);
      grid.lineTo(5000, i);
    }
    
    viewport.addChild(grid);

    // Add origin marker
    const origin = new PIXI.Graphics();
    origin.beginFill(0xff0000);
    origin.drawCircle(0, 0, 5);
    origin.endFill();
    viewport.addChild(origin);

    // Handle resize
    const handleResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
      viewport.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    };
  }, []);

  return <div ref={canvasRef} style={{ width: '100vw', height: '100vh' }} />;
}