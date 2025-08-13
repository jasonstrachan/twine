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

    // Initially disable drag - we'll control it with spacebar
    viewport
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

      // Track spacebar and mouse state for panning
      let isSpacePressed = false;
      let isPanning = false;
      let panStart = { x: 0, y: 0 };
      let viewportStart = { x: 0, y: 0 };

      // Keyboard handling
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ' && !isSpacePressed) {
          e.preventDefault(); // Prevent page scroll
          isSpacePressed = true;
          app.canvas.style.cursor = 'grab';
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          const selectedIds = useBlocksStore.getState().selectedBlockIds;
          selectedIds.forEach(id => {
            useBlocksStore.getState().deleteBlock(id);
          });
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ') {
          e.preventDefault();
          isSpacePressed = false;
          isPanning = false;
          app.canvas.style.cursor = 'default';
        }
      };

      // Mouse handling for panning
      const handleMouseDown = (e: MouseEvent) => {
        if (isSpacePressed) {
          e.preventDefault();
          isPanning = true;
          panStart = { x: e.clientX, y: e.clientY };
          viewportStart = { x: viewport.x, y: viewport.y };
          app.canvas.style.cursor = 'grabbing';
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (isPanning && isSpacePressed) {
          const deltaX = e.clientX - panStart.x;
          const deltaY = e.clientY - panStart.y;
          viewport.x = viewportStart.x + deltaX;
          viewport.y = viewportStart.y + deltaY;
        }
      };

      const handleMouseUp = () => {
        if (isPanning) {
          isPanning = false;
          if (isSpacePressed) {
            app.canvas.style.cursor = 'grab';
          } else {
            app.canvas.style.cursor = 'default';
          }
        }
      };

      // Paste handling - attach to window for better event capture
      const handlePaste = async (e: ClipboardEvent) => {
        console.log('=== PASTE HANDLER TRIGGERED ===');
        e.preventDefault();
        
        if (!e.clipboardData) {
          console.log('No clipboard data');
          return;
        }

        // Log all available clipboard formats
        console.log('Available formats:', e.clipboardData.types);
        
        // Try different methods to get image data
        const items = e.clipboardData.items;
        console.log('Clipboard items:', items ? Array.from(items).map(item => `${item.kind}:${item.type}`) : 'none');
        
        // Method 1: Check for file items (standard image paste)
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            console.log(`Item ${i}: kind=${item.kind}, type=${item.type}`);
            
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              console.log('Image file detected:', item.type);
              const imageFile = item.getAsFile();
              if (!imageFile) {
                console.log('Could not get file from item');
                continue;
              }

              try {
                // Convert to data URL
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(imageFile);
                });

                console.log('Data URL created, loading texture...');

                // Load texture
                const texture = await PIXI.Assets.load(dataUrl);
                const imageSprite = new PIXI.Sprite(texture);

                // Position at viewport center
                const screenCenterX = window.innerWidth / 2;
                const screenCenterY = window.innerHeight / 2;
                const worldPos = viewport.toWorld(screenCenterX, screenCenterY);
                
                imageSprite.anchor.set(0.5);
                imageSprite.x = worldPos.x;
                imageSprite.y = worldPos.y;
                
                // Scale to fit screen
                const maxDim = Math.min(window.innerWidth, window.innerHeight) * 0.8;
                const scale = Math.min(maxDim / imageSprite.width, maxDim / imageSprite.height, 1);
                imageSprite.scale.set(scale);

                // Make the Sprite Draggable
                imageSprite.eventMode = 'static';
                imageSprite.cursor = 'pointer';

                let dragging = false;
                let dragOffset: { x: number; y: number } | null = null;

                function onDragStart(this: PIXI.Sprite, event: any) {
                  this.alpha = 0.8;
                  dragging = true;
                  
                  const pointerPosition = event.data.getLocalPosition(this.parent);
                  dragOffset = {
                    x: pointerPosition.x - this.x,
                    y: pointerPosition.y - this.y
                  };
                }

                function onDragEnd(this: PIXI.Sprite) {
                  this.alpha = 1;
                  dragging = false;
                  dragOffset = null;
                }

                function onDragMove(this: PIXI.Sprite, event: any) {
                  if (dragging && dragOffset) {
                    const newPosition = event.data.getLocalPosition(this.parent);
                    this.x = newPosition.x - dragOffset.x;
                    this.y = newPosition.y - dragOffset.y;
                  }
                }

                // Add event listeners
                imageSprite.on('pointerdown', onDragStart);
                imageSprite.on('pointerup', onDragEnd);
                imageSprite.on('pointerupoutside', onDragEnd);
                imageSprite.on('pointermove', onDragMove);

                // Add to viewport
                viewport.addChild(imageSprite);
                console.log('✓ Image successfully added to canvas');
                return; // Exit after successful image paste

              } catch (error) {
                console.error('Error loading pasted image:', error);
              }
            }
          }
        }
        
        // Method 2: Check HTML content for image URLs
        const htmlData = e.clipboardData.getData('text/html');
        if (htmlData) {
          console.log('HTML data found, checking for images...');
          const imgMatch = htmlData.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch && imgMatch[1]) {
            console.log('Image URL found in HTML:', imgMatch[1]);
            try {
              const texture = await PIXI.Assets.load(imgMatch[1]);
              const imageSprite = new PIXI.Sprite(texture);
              
              const screenCenterX = window.innerWidth / 2;
              const screenCenterY = window.innerHeight / 2;
              const worldPos = viewport.toWorld(screenCenterX, screenCenterY);
              
              imageSprite.anchor.set(0.5);
              imageSprite.x = worldPos.x;
              imageSprite.y = worldPos.y;
              
              const maxDim = Math.min(window.innerWidth, window.innerHeight) * 0.8;
              const scale = Math.min(maxDim / imageSprite.width, maxDim / imageSprite.height, 1);
              imageSprite.scale.set(scale);
              
              imageSprite.eventMode = 'static';
              imageSprite.cursor = 'pointer';
              
              let dragging = false;
              let dragOffset: { x: number; y: number } | null = null;
              
              function onDragStart(this: PIXI.Sprite, event: any) {
                this.alpha = 0.8;
                dragging = true;
                const pointerPosition = event.data.getLocalPosition(this.parent);
                dragOffset = {
                  x: pointerPosition.x - this.x,
                  y: pointerPosition.y - this.y
                };
              }
              
              function onDragEnd(this: PIXI.Sprite) {
                this.alpha = 1;
                dragging = false;
                dragOffset = null;
              }
              
              function onDragMove(this: PIXI.Sprite, event: any) {
                if (dragging && dragOffset) {
                  const newPosition = event.data.getLocalPosition(this.parent);
                  this.x = newPosition.x - dragOffset.x;
                  this.y = newPosition.y - dragOffset.y;
                }
              }
              
              imageSprite.on('pointerdown', onDragStart);
              imageSprite.on('pointerup', onDragEnd);
              imageSprite.on('pointerupoutside', onDragEnd);
              imageSprite.on('pointermove', onDragMove);
              
              viewport.addChild(imageSprite);
              console.log('✓ Image from HTML successfully added to canvas');
              return;
            } catch (error) {
              console.error('Failed to load image from URL:', error);
            }
          }
        }
        
        console.log('No image data found in clipboard');
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('paste', handlePaste);
      app.canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      const handleResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
        viewport.resize(window.innerWidth, window.innerHeight);
      };

        window.addEventListener('resize', handleResize);

      return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('paste', handlePaste);
      app.canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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