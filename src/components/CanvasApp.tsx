import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useCanvasStore } from '../stores/canvasStore';
import { useBlocksStore, createTextBlock, createImageBlock } from '../stores/blocksStore';
import { useConnectionsStore } from '../stores/connectionsStore';
import type { Block, Connection } from '../types/canvas';

// Import block rendering logic
function renderBlock(container: PIXI.Container, block: Block, viewport: Viewport) {
  // Create container for this block
  const blockContainer = new PIXI.Container();
  blockContainer.label = block.id;
  blockContainer.position.set(block.position.x, block.position.y);
  
  // Background - invisible fill for hit detection, border when selected
  const bg = new PIXI.Graphics();
  
  // Invisible fill for hit detection
  bg.rect(0, 0, block.size.width, block.size.height);
  bg.fill({ color: 0x000000, alpha: 0.01 }); // Nearly transparent
  
  // Selection outline
  if (block.selected) {
    const scale = viewport.scale.x;
    const borderWidth = 1 / scale; // Scale-invariant border
    bg.setStrokeStyle({ width: borderWidth, color: 0x00aaff, alpha: 1 });
    bg.rect(0, 0, block.size.width, block.size.height);
    bg.stroke();
  }
  
  // Add background - make it non-interactive so container handles events
  bg.eventMode = 'none';
  blockContainer.addChild(bg);
  
  // Content based on type
  if (block.type === 'text') {
    // Add resize handles on all corners if selected
    if (block.selected) {
      const scale = viewport.scale.x;
      const handleSize = 8 / scale; // Scale-invariant size
      const halfHandle = handleSize / 2;
      
      // Bottom-right handle
      const handleBR = new PIXI.Graphics();
      handleBR.rect(block.size.width - halfHandle, block.size.height - halfHandle, handleSize, handleSize);
      handleBR.fill(0xffffff); // White handles
      handleBR.eventMode = 'static';
      handleBR.cursor = 'nwse-resize';
      handleBR.label = 'resize-handle-br';
      blockContainer.addChild(handleBR);
      
      // Top-left handle
      const handleTL = new PIXI.Graphics();
      handleTL.rect(-halfHandle, -halfHandle, handleSize, handleSize);
      handleTL.fill(0xffffff); // White handles
      handleTL.eventMode = 'static';
      handleTL.cursor = 'nwse-resize';
      handleTL.label = 'resize-handle-tl';
      blockContainer.addChild(handleTL);
      
      // Top-right handle
      const handleTR = new PIXI.Graphics();
      handleTR.rect(block.size.width - halfHandle, -halfHandle, handleSize, handleSize);
      handleTR.fill(0xffffff); // White handles
      handleTR.eventMode = 'static';
      handleTR.cursor = 'nesw-resize';
      handleTR.label = 'resize-handle-tr';
      blockContainer.addChild(handleTR);
      
      // Bottom-left handle
      const handleBL = new PIXI.Graphics();
      handleBL.rect(-halfHandle, block.size.height - halfHandle, handleSize, handleSize);
      handleBL.fill(0xffffff); // White handles
      handleBL.eventMode = 'static';
      handleBL.cursor = 'nesw-resize';
      handleBL.label = 'resize-handle-bl';
      blockContainer.addChild(handleBL);
    }
    
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
    text.eventMode = 'none'; // Make text non-interactive so bg handles clicks
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
    
    // Add resize handles on all corners if selected
    if (block.selected) {
      const scale = viewport.scale.x;
      const handleSize = 8 / scale; // Scale-invariant size
      const halfHandle = handleSize / 2;
      
      // Bottom-right handle
      const handleBR = new PIXI.Graphics();
      handleBR.rect(block.size.width - halfHandle, block.size.height - halfHandle, handleSize, handleSize);
      handleBR.fill(0xffffff); // White handles
      handleBR.eventMode = 'static';
      handleBR.cursor = 'nwse-resize';
      handleBR.label = 'resize-handle-br';
      blockContainer.addChild(handleBR);
      
      // Top-left handle
      const handleTL = new PIXI.Graphics();
      handleTL.rect(-halfHandle, -halfHandle, handleSize, handleSize);
      handleTL.fill(0xffffff); // White handles
      handleTL.eventMode = 'static';
      handleTL.cursor = 'nwse-resize';
      handleTL.label = 'resize-handle-tl';
      blockContainer.addChild(handleTL);
      
      // Top-right handle
      const handleTR = new PIXI.Graphics();
      handleTR.rect(block.size.width - halfHandle, -halfHandle, handleSize, handleSize);
      handleTR.fill(0xffffff); // White handles
      handleTR.eventMode = 'static';
      handleTR.cursor = 'nesw-resize';
      handleTR.label = 'resize-handle-tr';
      blockContainer.addChild(handleTR);
      
      // Bottom-left handle
      const handleBL = new PIXI.Graphics();
      handleBL.rect(-halfHandle, block.size.height - halfHandle, handleSize, handleSize);
      handleBL.fill(0xffffff); // White handles
      handleBL.eventMode = 'static';
      handleBL.cursor = 'nesw-resize';
      handleBL.label = 'resize-handle-bl';
      blockContainer.addChild(handleBL);
    }
  }
  
  // Make container interactive with full hit area
  blockContainer.eventMode = 'static';
  blockContainer.cursor = 'pointer';
  blockContainer.hitArea = new PIXI.Rectangle(0, 0, block.size.width, block.size.height);
  
  container.addChild(blockContainer);
  return blockContainer;
}

export function CanvasApp() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const blocksContainerRef = useRef<PIXI.Container | null>(null);
  
  const { setViewport, updateMouseWorldPos, updateZoom } = useCanvasStore();
  const { blocks, addBlock, selectBlock, deselectAll, moveBlock, resizeBlock, updateBlock } = useBlocksStore();
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
          e.preventDefault(); // Prevent default browser behavior
          const state = useBlocksStore.getState();
          const selectedIds = Array.from(state.selectedBlockIds);
          console.log('Delete key pressed, selected IDs:', selectedIds);
          if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
              console.log('Deleting block:', id);
              state.deleteBlock(id);
            });
          } else {
            console.log('No blocks selected for deletion');
          }
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
        let imageFound = false;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            console.log(`Item ${i}: kind=${item.kind}, type=${item.type}`);
            
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              imageFound = true;
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

                // Global drag handlers for robust tracking
                const handleImageDragMove = (event: any) => {
                  if (dragging && dragOffset) {
                    const newPosition = event.data.getLocalPosition(imageSprite.parent);
                    imageSprite.x = newPosition.x - dragOffset.x;
                    imageSprite.y = newPosition.y - dragOffset.y;
                  }
                };

                const handleImageDragEnd = () => {
                  if (dragging) {
                    imageSprite.alpha = 1;
                    dragging = false;
                    dragOffset = null;
                    viewport.off('pointermove', handleImageDragMove);
                    viewport.off('pointerup', handleImageDragEnd);
                    viewport.off('pointerupoutside', handleImageDragEnd);
                  }
                };

                function onDragStart(this: PIXI.Sprite, event: any) {
                  this.alpha = 0.8;
                  dragging = true;
                  
                  const pointerPosition = event.data.getLocalPosition(this.parent);
                  dragOffset = {
                    x: pointerPosition.x - this.x,
                    y: pointerPosition.y - this.y
                  };
                  
                  // Attach global listeners for robust dragging
                  viewport.on('pointermove', handleImageDragMove);
                  viewport.on('pointerup', handleImageDragEnd);
                  viewport.on('pointerupoutside', handleImageDragEnd);
                }

                // Add event listeners
                imageSprite.on('pointerdown', onDragStart);

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
        if (!imageFound) {
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
              
              // Global drag handlers for robust tracking
              const handleImageDragMove = (event: any) => {
                if (dragging && dragOffset) {
                  const newPosition = event.data.getLocalPosition(imageSprite.parent);
                  imageSprite.x = newPosition.x - dragOffset.x;
                  imageSprite.y = newPosition.y - dragOffset.y;
                }
              };

              const handleImageDragEnd = () => {
                if (dragging) {
                  imageSprite.alpha = 1;
                  dragging = false;
                  dragOffset = null;
                  viewport.off('pointermove', handleImageDragMove);
                  viewport.off('pointerup', handleImageDragEnd);
                  viewport.off('pointerupoutside', handleImageDragEnd);
                }
              };
              
              function onDragStart(this: PIXI.Sprite, event: any) {
                this.alpha = 0.8;
                dragging = true;
                const pointerPosition = event.data.getLocalPosition(this.parent);
                dragOffset = {
                  x: pointerPosition.x - this.x,
                  y: pointerPosition.y - this.y
                };
                
                // Attach global listeners for robust dragging
                viewport.on('pointermove', handleImageDragMove);
                viewport.on('pointerup', handleImageDragEnd);
                viewport.on('pointerupoutside', handleImageDragEnd);
              }
              
              imageSprite.on('pointerdown', onDragStart);
              
              viewport.addChild(imageSprite);
              console.log('✓ Image from HTML successfully added to canvas');
              return;
            } catch (error) {
              console.error('Failed to load image from URL:', error);
            }
          } else {
            console.log('No image found in HTML');
          }
        }
        }
        
        // Method 3: Try plain text if no image was found
        if (!imageFound) {
        const textData = e.clipboardData.getData('text/plain');
        if (textData && textData.trim()) {
          console.log('Text data found:', textData);
          
          // Get viewport center for placement
          const screenCenterX = window.innerWidth / 2;
          const screenCenterY = window.innerHeight / 2;
          const worldPos = viewport.toWorld(screenCenterX, screenCenterY);
          
          // Create container for text box
          const textContainer = new PIXI.Container();
          textContainer.x = worldPos.x;
          textContainer.y = worldPos.y;
          
          // Initial size
          let boxWidth = 200;
          let boxHeight = 100;
          
          // Background/border - invisible fill for hit detection, border when selected
          const background = new PIXI.Graphics();
          const drawBackground = (selected: boolean = false) => {
            background.clear();
            // Invisible fill for hit detection
            background.rect(0, 0, boxWidth, boxHeight);
            background.fill({ color: 0x000000, alpha: 0.01 }); // Nearly transparent
            
            if (selected) {
              // Blue border when selected - scale-invariant width
              const scale = viewport.scale.x;
              const borderWidth = 1 / scale; // Compensate for zoom
              background.setStrokeStyle({ width: borderWidth, color: 0x00aaff });
              background.rect(0, 0, boxWidth, boxHeight);
              background.stroke();
            }
            // Update hitArea to match new size
            background.hitArea = new PIXI.Rectangle(0, 0, boxWidth, boxHeight);
          };
          drawBackground();
          
          // Text
          const text = new PIXI.Text({
            text: textData,
            style: {
              fontSize: 14,
              fill: 0xffffff,
              wordWrap: true,
              wordWrapWidth: boxWidth - 20,
              breakWords: true,
            }
          });
          text.x = 10;
          text.y = 10;
          text.eventMode = 'none'; // Make text non-interactive so background handles clicks
          
          // Add to container
          textContainer.addChild(background);
          textContainer.addChild(text);
          
          // Make interactive - set hitArea to cover entire background
          background.eventMode = 'static';
          background.cursor = 'move';
          background.hitArea = new PIXI.Rectangle(0, 0, boxWidth, boxHeight);
          
          let isDragging = false;
          let isResizing = false;
          let isSelected = false;
          let dragOffset = { x: 0, y: 0 };
          let resizeStart = { width: boxWidth, height: boxHeight, x: 0, y: 0 };
          
          // Corner handles container (only visible when selected)
          const handlesContainer = new PIXI.Container();
          const baseHandleSize = 8;
          
          // Create 4 corner handles
          const handles = {
            tl: new PIXI.Graphics(), // top-left
            tr: new PIXI.Graphics(), // top-right
            bl: new PIXI.Graphics(), // bottom-left
            br: new PIXI.Graphics()  // bottom-right
          };
          
          const drawHandles = () => {
            // Clear all handles
            Object.values(handles).forEach(h => h.clear());
            
            if (isSelected) {
              // Scale-invariant handle size
              const scale = viewport.scale.x;
              const handleSize = baseHandleSize / scale;
              const halfHandle = handleSize / 2;
              
              // Top-left handle
              handles.tl.rect(0, 0, handleSize, handleSize);
              handles.tl.fill(0xffffff);
              handles.tl.position.set(-halfHandle, -halfHandle);
              handles.tl.eventMode = 'static';
              handles.tl.cursor = 'nwse-resize';
              
              // Top-right handle
              handles.tr.rect(0, 0, handleSize, handleSize);
              handles.tr.fill(0xffffff);
              handles.tr.position.set(boxWidth - halfHandle, -halfHandle);
              handles.tr.eventMode = 'static';
              handles.tr.cursor = 'nesw-resize';
              
              // Bottom-left handle
              handles.bl.rect(0, 0, handleSize, handleSize);
              handles.bl.fill(0xffffff);
              handles.bl.position.set(-halfHandle, boxHeight - halfHandle);
              handles.bl.eventMode = 'static';
              handles.bl.cursor = 'nesw-resize';
              
              // Bottom-right handle
              handles.br.rect(0, 0, handleSize, handleSize);
              handles.br.fill(0xffffff);
              handles.br.position.set(boxWidth - halfHandle, boxHeight - halfHandle);
              handles.br.eventMode = 'static';
              handles.br.cursor = 'nwse-resize';
            }
          };
          
          // Add handles to container
          Object.values(handles).forEach(h => handlesContainer.addChild(h));
          textContainer.addChild(handlesContainer);
          
          // Redraw on zoom to maintain visual consistency
          viewport.on('zoomed', () => {
            if (isSelected) {
              drawBackground(true);
              drawHandles();
            }
          });
          
          // Delete key handler for pasted text blocks
          const handlePastedTextDelete = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && isSelected) {
              e.preventDefault();
              console.log('Deleting pasted text block');
              viewport.removeChild(textContainer);
              window.removeEventListener('keydown', handlePastedTextDelete);
            }
          };
          
          // Select/deselect
          const select = () => {
            isSelected = true;
            drawBackground(true);
            drawHandles();
            window.addEventListener('keydown', handlePastedTextDelete);
          };
          
          const deselect = () => {
            isSelected = false;
            drawBackground(false);
            drawHandles();
            window.removeEventListener('keydown', handlePastedTextDelete);
          };
          
          // Drag handling with global viewport events for robust tracking
          const handlePointerMove = (e: any) => {
            if (isDragging && !isResizing) {
              const pos = e.data.getLocalPosition(textContainer.parent);
              textContainer.x = pos.x - dragOffset.x;
              textContainer.y = pos.y - dragOffset.y;
            }
          };
          
          const handlePointerUp = () => {
            if (isDragging) {
              isDragging = false;
              viewport.off('pointermove', handlePointerMove);
              viewport.off('pointerup', handlePointerUp);
              viewport.off('pointerupoutside', handlePointerUp);
            }
          };
          
          // Combined pointerdown handler for drag and double-click (following example pattern)
          let lastClickTime = 0;
          let dragging = false;
          const doubleClickSpeed = 300; // ms
          
          background.on('pointerdown', (e: any) => {
            if (isSpacePressed) return; // Don't interfere with panning
            
            e.stopPropagation();
            select();
            
            // Start potential drag
            const pos = e.data.getLocalPosition(textContainer.parent);
            dragOffset = {
              x: pos.x - textContainer.x,
              y: pos.y - textContainer.y
            };
            isDragging = true;
            dragging = false; // Reset dragging detection
            
            // Attach global listeners for dragging
            viewport.on('pointermove', handlePointerMove);
            viewport.on('pointerup', handlePointerUp);
            viewport.on('pointerupoutside', handlePointerUp);
          });
          
          // Modified pointer move to detect actual dragging
          const handlePointerMoveWithDragDetection = (e: any) => {
            if (isDragging && !isResizing) {
              const pos = e.data.getLocalPosition(textContainer.parent);
              const newX = pos.x - dragOffset.x;
              const newY = pos.y - dragOffset.y;
              
              // Detect if we've moved more than 5 pixels (actual drag)
              if (Math.abs(newX - textContainer.x) > 5 || Math.abs(newY - textContainer.y) > 5) {
                dragging = true;
              }
              
              if (dragging) {
                textContainer.x = newX;
                textContainer.y = newY;
              }
            }
          };
          
          // Modified pointer up to handle double-click
          const handlePointerUpWithDoubleClick = () => {
            if (isDragging) {
              isDragging = false;
              viewport.off('pointermove', handlePointerMoveWithDragDetection);
              viewport.off('pointerup', handlePointerUpWithDoubleClick);
              viewport.off('pointerupoutside', handlePointerUpWithDoubleClick);
              
              // Check for double-click only if we didn't drag
              if (!dragging) {
                const now = Date.now();
                if (now - lastClickTime < doubleClickSpeed) {
                  // This is a double-click - start editing
                  console.log('Double-click detected! Starting edit mode...');
                  startEditingPastedText();
                  lastClickTime = 0; // Reset to prevent triple-click
                } else {
                  // This is a single click
                  lastClickTime = now;
                }
              }
            }
          };
          
          // Function to start editing (following example pattern)
          const startEditingPastedText = () => {
            if ((text as any).editing) return;
            (text as any).editing = true;
            
            // Get exact position including text offset
            const globalPos = textContainer.toGlobal(new PIXI.Point(10, 10));
            const textarea = document.createElement('textarea');
            
            // Account for zoom scale
            const scale = viewport.scale.x;
            const scaledWidth = (boxWidth - 20) * scale;
            const scaledHeight = (boxHeight - 20) * scale;
            const scaledFontSize = 14 * scale;
            
            textarea.value = text.text;
            textarea.style.position = 'fixed';
            textarea.style.left = `${globalPos.x}px`;
            textarea.style.top = `${globalPos.y}px`;
            textarea.style.width = `${scaledWidth}px`;
            textarea.style.height = `${scaledHeight}px`;
            textarea.style.fontSize = `${scaledFontSize}px`;
            textarea.style.lineHeight = '1.2';
            textarea.style.padding = '0';
            textarea.style.margin = '0';
            textarea.style.color = '#ffffff'; // White text to match PIXI text
            textarea.style.caretColor = '#00aaff'; // Blue cursor matching selection color
            textarea.style.backgroundColor = 'transparent';
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            textarea.style.zIndex = '100';
            textarea.style.overflow = 'hidden';
            
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            
            // Keep handles visible during edit, but hide PIXI text to avoid double vision
            text.visible = false;
            
            // Update PIXI text in real-time (even though hidden) for when we exit
            textarea.addEventListener('input', () => {
              text.text = textarea.value || ' ';
            });
            
            const cleanup = () => {
              if (textarea.parentNode) {
                document.body.removeChild(textarea);
              }
              (text as any).editing = false;
              textarea.removeEventListener('blur', saveAndExit);
              textarea.removeEventListener('input', handleInput);
              textarea.removeEventListener('keydown', handleKeyDown);
            };
            
            const handleInput = () => {
              text.text = textarea.value || ' ';
            };
            
            const saveAndExit = () => {
              text.text = textarea.value || ' ';
              text.visible = true;
              cleanup();
            };
            
            const cancelAndExit = () => {
              text.visible = true;
              cleanup();
            };
            
            const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveAndExit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelAndExit();
              }
            };
            
            textarea.addEventListener('blur', saveAndExit);
            textarea.addEventListener('keydown', handleKeyDown);
          };
          
          // Override the original handlers with our new ones
          background.off('pointerdown');
          background.on('pointerdown', (e: any) => {
            if (isSpacePressed) return;
            
            e.stopPropagation();
            select();
            
            const pos = e.data.getLocalPosition(textContainer.parent);
            dragOffset = {
              x: pos.x - textContainer.x,
              y: pos.y - textContainer.y
            };
            isDragging = true;
            dragging = false;
            
            viewport.on('pointermove', handlePointerMoveWithDragDetection);
            viewport.on('pointerup', handlePointerUpWithDoubleClick);
            viewport.on('pointerupoutside', handlePointerUpWithDoubleClick);
          });
          
          // Resize handling with global viewport events
          let resizeHandle = ''; // track which handle is being dragged
          
          const handleResizeMove = (e: any) => {
            if (isResizing && resizeHandle) {
              const pos = e.data.getLocalPosition(viewport);
              const deltaX = pos.x - resizeStart.x;
              const deltaY = pos.y - resizeStart.y;
              
              let newWidth = boxWidth;
              let newHeight = boxHeight;
              let newX = textContainer.x;
              let newY = textContainer.y;
              
              // Handle different corners
              switch(resizeHandle) {
                case 'br': // Bottom-right
                  newWidth = Math.max(100, resizeStart.width + deltaX);
                  newHeight = Math.max(50, resizeStart.height + deltaY);
                  break;
                case 'tl': // Top-left
                  newWidth = Math.max(100, resizeStart.width - deltaX);
                  newHeight = Math.max(50, resizeStart.height - deltaY);
                  if (newWidth > 100) newX = textContainer.x + deltaX;
                  if (newHeight > 50) newY = textContainer.y + deltaY;
                  break;
                case 'tr': // Top-right
                  newWidth = Math.max(100, resizeStart.width + deltaX);
                  newHeight = Math.max(50, resizeStart.height - deltaY);
                  if (newHeight > 50) newY = textContainer.y + deltaY;
                  break;
                case 'bl': // Bottom-left
                  newWidth = Math.max(100, resizeStart.width - deltaX);
                  newHeight = Math.max(50, resizeStart.height + deltaY);
                  if (newWidth > 100) newX = textContainer.x + deltaX;
                  break;
              }
              
              boxWidth = newWidth;
              boxHeight = newHeight;
              textContainer.x = newX;
              textContainer.y = newY;
              
              // Redraw background and handles
              drawBackground(isSelected);
              drawHandles();
              
              // Update text wrap
              text.style.wordWrapWidth = boxWidth - 20;
            }
          };
          
          const handleResizeEnd = () => {
            if (isResizing) {
              isResizing = false;
              resizeHandle = '';
              viewport.off('pointermove', handleResizeMove);
              viewport.off('pointerup', handleResizeEnd);
              viewport.off('pointerupoutside', handleResizeEnd);
            }
          };
          
          // Add resize handlers to all corner handles
          Object.entries(handles).forEach(([key, handle]) => {
            handle.on('pointerdown', (e: any) => {
              isResizing = true;
              resizeHandle = key;
              const pos = e.data.getLocalPosition(viewport);
              resizeStart = {
                width: boxWidth,
                height: boxHeight,
                x: pos.x,
                y: pos.y
              };
              e.stopPropagation();
              
              // Attach global listeners for robust resizing
              viewport.on('pointermove', handleResizeMove);
              viewport.on('pointerup', handleResizeEnd);
              viewport.on('pointerupoutside', handleResizeEnd);
            });
          });
          
          
          
          // Click on viewport to deselect
          viewport.on('pointerdown', () => {
            if (isSelected && !isDragging && !isResizing) {
              deselect();
            }
          });
          
          // Add to viewport
          viewport.addChild(textContainer);
          console.log('✓ Text successfully added to canvas');
          return;
        } else {
          console.log('No text data found in clipboard');
        }
        }
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
      const blockContainer = renderBlock(container, block, viewport);
      
      // Drag and resize handling
      let isDragging = false;
      let isResizing = false;
      let dragging = false;
      let dragStart = { x: 0, y: 0 };
      let resizeStart = { width: block.size.width, height: block.size.height, x: 0, y: 0 };
      let lastClickTime = 0;
      const doubleClickSpeed = 300;
      
      // Function to start editing system blocks (following example pattern)
      const startEditingSystemBlock = () => {
        if ((blockContainer as any).editing) return;
        (blockContainer as any).editing = true;
        
        // Get exact position including text offset
        const globalPos = blockContainer.toGlobal(new PIXI.Point(10, 10));
        const textarea = document.createElement('textarea');
        
        // Account for zoom scale
        const scale = viewport.scale.x;
        const scaledWidth = (block.size.width - 20) * scale;
        const scaledHeight = (block.size.height - 20) * scale;
        const scaledFontSize = (block.content.fontSize || 16) * scale;
        
        textarea.value = block.content.text || '';
        textarea.style.position = 'fixed';
        textarea.style.left = `${globalPos.x}px`;
        textarea.style.top = `${globalPos.y}px`;
        textarea.style.width = `${scaledWidth}px`;
        textarea.style.height = `${scaledHeight}px`;
        textarea.style.fontSize = `${scaledFontSize}px`;
        textarea.style.lineHeight = '1.2';
        textarea.style.padding = '0';
        textarea.style.margin = '0';
        textarea.style.color = '#ffffff'; // White text to match PIXI text
        textarea.style.caretColor = '#00aaff'; // Blue cursor matching selection color
        textarea.style.backgroundColor = 'transparent';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        textarea.style.zIndex = '100';
        textarea.style.overflow = 'hidden';
        
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        // Hide PIXI text to avoid double vision, keep handles visible
        const textElement = blockContainer.children.find((child: any) => child instanceof PIXI.Text) as PIXI.Text;
        if (textElement) textElement.visible = false;
        
        // Update text in real-time (even though hidden) for when we exit
        textarea.addEventListener('input', () => {
          updateBlock(block.id, {
            content: { ...block.content, text: textarea.value || ' ' }
          });
        });
        
        const cleanup = () => {
          if (textarea.parentNode) {
            document.body.removeChild(textarea);
          }
          (blockContainer as any).editing = false;
          textarea.removeEventListener('blur', saveAndExit);
          textarea.removeEventListener('input', handleInput);
          textarea.removeEventListener('keydown', handleKeyDown);
        };
        
        const handleInput = () => {
          updateBlock(block.id, {
            content: { ...block.content, text: textarea.value || ' ' }
          });
        };
        
        const saveAndExit = () => {
          updateBlock(block.id, {
            content: { ...block.content, text: textarea.value || ' ' }
          });
          if (textElement) textElement.visible = true;
          cleanup();
        };
        
        const cancelAndExit = () => {
          if (textElement) textElement.visible = true;
          cleanup();
        };
        
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveAndExit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            cancelAndExit();
          }
        };
        
        textarea.addEventListener('blur', saveAndExit);
        textarea.addEventListener('keydown', handleKeyDown);
      };
      
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
          dragging = false; // Reset dragging detection
        }
      });
      
      // Use global pointermove on viewport to prevent losing drag when moving fast
      const handlePointerMove = (e: any) => {
        if (isDragging && !isResizing) {
          const global = e.data.global;
          const world = viewport.toWorld(global.x, global.y);
          const newX = world.x - dragStart.x;
          const newY = world.y - dragStart.y;
          
          // Detect if we've moved more than 5 pixels (actual drag)
          if (Math.abs(newX - block.position.x) > 5 || Math.abs(newY - block.position.y) > 5) {
            dragging = true;
          }
          
          if (dragging) {
            moveBlock(block.id, newX, newY);
          }
        }
      };
      
      viewport.on('pointermove', handlePointerMove);
      
      // Use global pointerup to ensure drag ends even when mouse is released outside
      const handlePointerUp = () => {
        if (isDragging || isResizing) {
          const wasResizing = isResizing;
          isDragging = false;
          isResizing = false;
          viewport.off('pointermove', handlePointerMove);
          viewport.off('pointerup', handlePointerUp);
          viewport.off('pointerupoutside', handlePointerUp);
          
          // Check for double-click only if we didn't drag and it's a text block
          if (!dragging && !wasResizing && block.type === 'text') {
            const now = Date.now();
            if (now - lastClickTime < doubleClickSpeed) {
              // This is a double-click - start editing
              console.log('Double-click detected on system block! Starting edit mode...');
              startEditingSystemBlock();
              lastClickTime = 0; // Reset to prevent triple-click
            } else {
              // This is a single click
              lastClickTime = now;
            }
          }
        }
      };
      
      viewport.on('pointerup', handlePointerUp);
      viewport.on('pointerupoutside', handlePointerUp);
      
      // Add resize handle interaction for all corners
      const resizeHandles = blockContainer.children.filter((child: any) => 
        child.label && child.label.startsWith('resize-handle-')
      );
      resizeHandles.forEach((handle: any) => {
        handle.on('pointerdown', (e: any) => {
          e.stopPropagation();
          isResizing = true;
          isDragging = false;
          const handleType = handle.label.split('-')[2]; // Get 'br', 'tl', 'tr', 'bl'
          const global = e.data.global;
          const world = viewport.toWorld(global.x, global.y);
          resizeStart = {
            width: block.size.width,
            height: block.size.height,
            x: world.x,
            y: world.y
          };
          
          // Handle resize on global pointermove to prevent losing resize when moving fast
          const handleResizeMove = (e: any) => {
            if (!isResizing) return;
            
            const global = e.data.global;
            const world = viewport.toWorld(global.x, global.y);
            const deltaX = world.x - resizeStart.x;
            const deltaY = world.y - resizeStart.y;
            
            let newWidth = block.size.width;
            let newHeight = block.size.height;
            let newX = block.position.x;
            let newY = block.position.y;
            
            // Handle different corners
            switch(handleType) {
              case 'br': // Bottom-right
                newWidth = resizeStart.width + deltaX;
                newHeight = resizeStart.height + deltaY;
                break;
              case 'tl': // Top-left
                newWidth = resizeStart.width - deltaX;
                newHeight = resizeStart.height - deltaY;
                newX = block.position.x + deltaX;
                newY = block.position.y + deltaY;
                break;
              case 'tr': // Top-right
                newWidth = resizeStart.width + deltaX;
                newHeight = resizeStart.height - deltaY;
                newY = block.position.y + deltaY;
                break;
              case 'bl': // Bottom-left
                newWidth = resizeStart.width - deltaX;
                newHeight = resizeStart.height + deltaY;
                newX = block.position.x + deltaX;
                break;
            }
            
            // Apply minimum size constraints
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            // Update position if needed (for tl, tr, bl handles)
            if (newX !== block.position.x || newY !== block.position.y) {
              moveBlock(block.id, newX, newY);
            }
            resizeBlock(block.id, newWidth, newHeight);
          };
          
          const handleResizeEnd = () => {
            isResizing = false;
            viewport.off('pointermove', handleResizeMove);
            viewport.off('pointerup', handleResizeEnd);
            viewport.off('pointerupoutside', handleResizeEnd);
          };
          
          viewport.on('pointermove', handleResizeMove);
          viewport.on('pointerup', handleResizeEnd);
          viewport.on('pointerupoutside', handleResizeEnd);
        });
      });
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