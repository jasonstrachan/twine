import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useCanvasStore } from '../stores/canvasStore';
import { useBlocksStore, createTextBlock, createImageBlock } from '../stores/blocksStore';
import { useConnectionsStore } from '../stores/connectionsStore';
import type { Block, Connection } from '../types/canvas';

// Import block rendering logic
function renderBlock(container: PIXI.Container, block: Block) {
  // Create container for this block
  const blockContainer = new PIXI.Container();
  blockContainer.label = block.id;
  blockContainer.position.set(block.position.x, block.position.y);
  
  // Background
  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, block.size.width, block.size.height, 8);
  bg.fill(0x2a2a2a);
  
  // Selection outline
  if (block.selected) {
    bg.setStrokeStyle({ width: 2, color: 0x00aaff, alpha: 1 });
    bg.roundRect(-2, -2, block.size.width + 4, block.size.height + 4, 8);
    bg.stroke();
  }
  
  blockContainer.addChild(bg);
  
  // Content based on type
  if (block.type === 'text') {
    // Ensure minimum dimensions to avoid WebGL errors
    const wordWrapWidth = Math.max(20, block.size.width - 20);
    
    const text = new PIXI.Text({
      text: block.content.text || ' ', // Ensure non-empty text
      style: {
        fontSize: block.content.fontSize || 16,
        fill: block.content.color || '#ffffff',
        wordWrap: true,
        wordWrapWidth: wordWrapWidth,
      }
    });
    text.position.set(10, 10);
    blockContainer.addChild(text);
  } else if (block.type === 'image') {
    // Show loading placeholder initially
    const loadingText = new PIXI.Text({
      text: 'Loading...',
      style: {
        fontSize: 14,
        fill: 0x999999,
      }
    });
    loadingText.anchor.set(0.5);
    loadingText.position.set(block.size.width / 2, block.size.height / 2);
    blockContainer.addChild(loadingText);
    
    // Load image - for blob URLs, create texture directly to avoid cache warnings
    let sprite: PIXI.Sprite;
    
    try {
      if (block.content.url.startsWith('blob:')) {
        // For blob URLs, create texture directly without going through Assets cache
        const texture = PIXI.Texture.from(block.content.url);
        sprite = new PIXI.Sprite(texture);
      } else {
        // For regular URLs, use normal loading
        sprite = PIXI.Sprite.from(block.content.url);
      }
      
      sprite.width = block.size.width;
      sprite.height = block.size.height;
      
      // Remove loading text once loaded or on error
      if (sprite.texture && sprite.texture.valid) {
        // Already loaded
        blockContainer.removeChild(loadingText);
      } else {
        sprite.texture.on('update', () => {
          if (blockContainer.children.includes(loadingText)) {
            blockContainer.removeChild(loadingText);
          }
        });
        
        sprite.texture.on('error', () => {
          console.warn('Failed to load image:', block.content.url);
          if (blockContainer.children.includes(loadingText)) {
            blockContainer.removeChild(loadingText);
          }
          // Show error placeholder
          const errorText = new PIXI.Text({
            text: 'Image failed',
            style: {
              fontSize: 12,
              fill: 0xff0000,
            }
          });
          errorText.position.set(10, 10);
          blockContainer.addChild(errorText);
        });
      }
      
      blockContainer.addChild(sprite);
    } catch (error) {
      console.warn('Error loading image:', error);
      blockContainer.removeChild(loadingText);
    }
    
    // Add resize handle if selected
    if (block.selected) {
      const handle = new PIXI.Graphics();
      handle.rect(block.size.width - 10, block.size.height - 10, 10, 10);
      handle.fill(0x00aaff);
      handle.interactive = true;
      handle.cursor = 'nwse-resize';
      handle.label = 'resize-handle';
      blockContainer.addChild(handle);
    }
  }
  
  // Make interactive
  blockContainer.interactive = true;
  blockContainer.cursor = 'pointer';
  
  container.addChild(blockContainer);
  return blockContainer;
}

export function CanvasApp() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const blocksContainerRef = useRef<PIXI.Container | null>(null);
  
  const { setViewport, updateMouseWorldPos, updateZoom } = useCanvasStore();
  const { blocks, addBlock, selectBlock, deselectAll, moveBlock, resizeBlock } = useBlocksStore();
  const { connections, connectionMode, connectingFrom, addConnection, setConnectingFrom } = useConnectionsStore();

  // Initial setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const initApp = async () => {
      const app = new PIXI.Application();
      
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      canvasRef.current!.appendChild(app.canvas);
      appRef.current = app;

      const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 10000,
      worldHeight: 10000,
      events: app.renderer.events,
    });

    app.stage.addChild(viewport as any);
    viewportRef.current = viewport;
    setViewport(viewport);

    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate();

    // Grid
    const grid = new PIXI.Graphics();
    grid.setStrokeStyle({ width: 1, color: 0x333333, alpha: 0.5 });
    for (let i = -5000; i <= 5000; i += 100) {
      grid.moveTo(i, -5000);
      grid.lineTo(i, 5000);
      grid.moveTo(-5000, i);
      grid.lineTo(5000, i);
    }
    grid.stroke();
    viewport.addChild(grid);

    // Origin marker
    const origin = new PIXI.Graphics();
    origin.circle(0, 0, 5);
    origin.fill(0xff0000);
    viewport.addChild(origin);

    // Container for connections (below blocks)
    const connectionsContainer = new PIXI.Container();
    viewport.addChild(connectionsContainer);
    
    // Container for blocks
    const blocksContainer = new PIXI.Container();
    viewport.addChild(blocksContainer);
    blocksContainerRef.current = blocksContainer;

      // Mouse tracking
      app.canvas.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = app.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = viewport.toWorld(x, y);
        updateMouseWorldPos(worldPos.x, worldPos.y);
      });

      // Zoom tracking
      viewport.on('zoomed', () => {
        updateZoom(viewport.scale.x);
      });

      // Double-click to create block
      app.canvas.addEventListener('dblclick', (e: MouseEvent) => {
        const rect = app.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = viewport.toWorld(x, y);
      
      const newBlock = createTextBlock(worldPos.x - 100, worldPos.y - 50);
        addBlock(newBlock);
      });

      // Click on background to deselect
      viewport.on('clicked', (e: any) => {
        if (e.target === viewport) {
          deselectAll();
        }
      });

      // Keyboard handling
      const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedIds = useBlocksStore.getState().selectedBlockIds;
        selectedIds.forEach(id => {
          useBlocksStore.getState().deleteBlock(id);
        });
        }
      };

      // Paste handling
      const handlePaste = async (e: ClipboardEvent) => {
        console.log('Paste event triggered');
        e.preventDefault();
        
        // Check for images
        const items = Array.from(e.clipboardData?.items || []);
        console.log('Clipboard items:', items.map(item => item.type));
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem) {
          console.log('Image found in clipboard:', imageItem.type);
          const blob = imageItem.getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            console.log('Created blob URL:', url);
            
            // Get mouse position for placement
            const rect = app.canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const worldPos = viewport.toWorld(centerX, centerY);
            
            // Create image block
            const img = new Image();
            img.onload = () => {
              console.log('Image loaded:', img.width, 'x', img.height);
              const aspectRatio = img.width / img.height;
              const width = 300;
              const height = width / aspectRatio;
              
              console.log('World position for image:', worldPos);
              const imageBlock = createImageBlock(
                worldPos.x - width/2, 
                worldPos.y - height/2, 
                url, 
                width, 
                height
              );
              console.log('Adding image block at:', imageBlock.position, 'with size:', imageBlock.size);
              addBlock(imageBlock);
            };
            img.onerror = (err) => {
              console.error('Failed to load image:', err);
            };
            img.src = url;
          }
        } else {
          console.log('No image in clipboard, checking for text...');
          // Handle text paste
          const text = e.clipboardData?.getData('text');
          if (text) {
            console.log('Text found:', text);
            const rect = app.canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const worldPos = viewport.toWorld(centerX, centerY);
            
            const textBlock = createTextBlock(worldPos.x - 100, worldPos.y - 50, text);
            addBlock(textBlock);
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('paste', handlePaste);

      const handleResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
        viewport.resize(window.innerWidth, window.innerHeight);
      };

        window.addEventListener('resize', handleResize);

      return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      };
    };

    initApp();
  }, []);

  // Re-render blocks when they change
  useEffect(() => {
    const container = blocksContainerRef.current;
    const viewport = viewportRef.current;
    
    if (!container || !viewport) return;
    
    // Clear existing blocks
    container.removeChildren();
    
    // Render all blocks
    blocks.forEach((block) => {
      const blockContainer = renderBlock(container, block);
      
      // Drag and resize handling
      let isDragging = false;
      let isResizing = false;
      let dragStart = { x: 0, y: 0 };
      let resizeStart = { width: block.size.width, height: block.size.height, x: 0, y: 0 };
      
      blockContainer.on('pointerdown', (e: any) => {
        e.stopPropagation();
        
        // Check if we're in connection mode (Shift held)
        if (e.data.originalEvent.shiftKey) {
          if (!connectingFrom) {
            // Start connection
            setConnectingFrom(block.id);
          } else if (connectingFrom !== block.id) {
            // Complete connection
            addConnection(connectingFrom, block.id);
            setConnectingFrom(null);
          }
        } else {
          // Normal selection and drag
          selectBlock(block.id, e.data.originalEvent.ctrlKey || e.data.originalEvent.metaKey);
          
          const global = e.data.global;
          const world = viewport.toWorld(global.x, global.y);
          dragStart = {
            x: world.x - block.position.x,
            y: world.y - block.position.y,
          };
          isDragging = true;
        }
      });
      
      blockContainer.on('pointermove', (e: any) => {
        if (!isDragging || isResizing) return;
        
        const global = e.data.global;
        const world = viewport.toWorld(global.x, global.y);
        moveBlock(block.id, world.x - dragStart.x, world.y - dragStart.y);
      });
      
      blockContainer.on('pointerup', () => {
        isDragging = false;
        isResizing = false;
      });
      
      blockContainer.on('pointerupoutside', () => {
        isDragging = false;
        isResizing = false;
      });
      
      // Add resize handle interaction
      const resizeHandle = blockContainer.children.find((child: any) => child.label === 'resize-handle');
      if (resizeHandle) {
        resizeHandle.on('pointerdown', (e: any) => {
          e.stopPropagation();
          isResizing = true;
          const global = e.data.global;
          const world = viewport.toWorld(global.x, global.y);
          resizeStart = {
            width: block.size.width,
            height: block.size.height,
            x: world.x,
            y: world.y
          };
        });
        
        resizeHandle.on('pointermove', (e: any) => {
          if (!isResizing) return;
          
          const global = e.data.global;
          const world = viewport.toWorld(global.x, global.y);
          const deltaX = world.x - resizeStart.x;
          const deltaY = world.y - resizeStart.y;
          
          const newWidth = resizeStart.width + deltaX;
          const newHeight = resizeStart.height + deltaY;
          
          resizeBlock(block.id, newWidth, newHeight);
        });
      }
    });
  }, [blocks, selectBlock, moveBlock, resizeBlock, connectingFrom, setConnectingFrom, addConnection]);
  
  // Render connections
  useEffect(() => {
    if (!viewportRef.current) return;
    
    const viewport = viewportRef.current;
    let connectionsGraphics = viewport.children.find((child: any) => child.label === 'connections') as PIXI.Graphics;
    
    if (!connectionsGraphics) {
      connectionsGraphics = new PIXI.Graphics();
      connectionsGraphics.label = 'connections';
      viewport.addChildAt(connectionsGraphics, 1); // Add after grid but before blocks
    }
    
    connectionsGraphics.clear();
    
    // Draw all connections
    connections.forEach((connection) => {
      const fromBlock = blocks.find(b => b.id === connection.from);
      const toBlock = blocks.find(b => b.id === connection.to);
      
      if (!fromBlock || !toBlock) return;
      
      // Calculate connection points (center of blocks)
      const fromX = fromBlock.position.x + fromBlock.size.width / 2;
      const fromY = fromBlock.position.y + fromBlock.size.height / 2;
      const toX = toBlock.position.x + toBlock.size.width / 2;
      const toY = toBlock.position.y + toBlock.size.height / 2;
      
      // Draw curved connection
      connectionsGraphics.setStrokeStyle({ width: 2, color: 0x666666, alpha: 0.8 });
      connectionsGraphics.moveTo(fromX, fromY);
      
      // Calculate control points for bezier curve
      const distance = Math.abs(toX - fromX);
      const controlOffset = Math.min(distance * 0.5, 100);
      
      connectionsGraphics.bezierCurveTo(
        fromX + controlOffset, fromY,
        toX - controlOffset, toY,
        toX, toY
      );
      
      connectionsGraphics.stroke();
    });
  }, [connections, blocks]);

  return <div ref={canvasRef} style={{ width: '100vw', height: '100vh' }} />;
}