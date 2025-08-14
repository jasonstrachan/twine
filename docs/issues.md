# Known Issues and Fixes

## Drag Stops When Moving Fast (Fixed)

### Problem
When dragging text blocks or images quickly, the drag operation would stop if the cursor moved outside the element's hit area. This made the interface feel unresponsive during fast movements.

### Root Cause
The paste-created elements (text and images) were using local event handlers attached directly to the dragged element:
```javascript
// BAD: Local event pattern that loses tracking
background.on('pointermove', (e) => {
  // This stops firing when cursor leaves the element
});
```

When the cursor moves faster than the frame rate, it can exit the element's bounds before the next pointermove event, causing the drag to stop.

### Solution
Use global viewport event handlers that continue tracking mouse movement regardless of cursor position:

```javascript
// GOOD: Global event pattern for robust dragging
element.on('pointerdown', (e) => {
  isDragging = true;
  // Calculate drag offset
  
  const handleMove = (e) => {
    if (isDragging) {
      // Update position
    }
  };
  
  const handleUp = () => {
    isDragging = false;
    viewport.off('pointermove', handleMove);
    viewport.off('pointerup', handleUp);
    viewport.off('pointerupoutside', handleUp);
  };
  
  // Attach to viewport for global tracking
  viewport.on('pointermove', handleMove);
  viewport.on('pointerup', handleUp);
  viewport.on('pointerupoutside', handleUp);
});
```

### Implementation Pattern for All Draggable Elements

Any new draggable element should follow this pattern:

1. **Start drag on pointerdown** of the element
2. **Track movement globally** on the viewport/stage
3. **Clean up properly** on pointerup/pointerupoutside
4. **Use viewport coordinates** for position calculations

Example implementation:
```javascript
function makeDraggable(element, viewport) {
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  
  element.on('pointerdown', (e) => {
    e.stopPropagation();
    isDragging = true;
    
    const pos = e.data.getLocalPosition(element.parent);
    dragOffset = {
      x: pos.x - element.x,
      y: pos.y - element.y
    };
    
    const handleGlobalMove = (e) => {
      if (!isDragging) return;
      
      const pos = e.data.getLocalPosition(element.parent);
      element.x = pos.x - dragOffset.x;
      element.y = pos.y - dragOffset.y;
    };
    
    const handleGlobalUp = () => {
      isDragging = false;
      viewport.off('pointermove', handleGlobalMove);
      viewport.off('pointerup', handleGlobalUp);
      viewport.off('pointerupoutside', handleGlobalUp);
    };
    
    viewport.on('pointermove', handleGlobalMove);
    viewport.on('pointerup', handleGlobalUp);
    viewport.on('pointerupoutside', handleGlobalUp);
  });
}
```

### Files Affected
- `/src/components/CanvasApp.tsx` (lines 659-680, 426-446, 490-510, 696-716)

### Testing
To verify the fix:
1. Paste text or image onto canvas
2. Click and drag very fast in circles
3. Drag should continue smoothly even when cursor temporarily exits the element

---

## Text Block Hit Area (Fixed)

### Problem
Text blocks could only be dragged from edges where there was no text, not from the entire block area.

### Root Cause
The PIXI.Text element wasn't set to `eventMode = 'none'`, causing it to intercept pointer events.

### Solution
Set `text.eventMode = 'none'` to make text non-interactive and allow the background to handle all events.

---

## Manual Double-Click Detection (Implemented)

### Problem
PIXI's built-in dblclick event can conflict with drag-and-drop logic, making double-click to edit unreliable.

### Solution
Implement manual double-click detection using timestamp tracking:

```javascript
// Manual double-click detection pattern
let lastTapTime = 0;

element.on('pointerdown', (e) => {
  const currentTime = Date.now();
  const timeDiff = currentTime - lastTapTime;
  
  // Check for double-click first (300ms window)
  if (timeDiff < 300 && timeDiff > 0) {
    // Double-click detected - enter edit mode
    e.stopPropagation();
    lastTapTime = 0; // Reset to prevent triple-click
    isDragging = false; // Cancel any drag
    
    enterEditMode();
    return; // Exit early, no dragging on double-click
  }
  
  // Single click - start drag
  lastTapTime = currentTime;
  startDrag(e);
});
```

### Key Benefits
1. **Independent of drag logic** - Double-click check happens before drag initialization
2. **Customizable timing** - 300ms window is standard but adjustable
3. **No event conflicts** - Manual detection avoids PIXI event system issues
4. **Reliable detection** - Works consistently across different interaction speeds

### Implementation Details
- Track last click timestamp per element
- Compare time delta on each pointerdown
- Reset timestamp after double-click to prevent triple-click
- Exit early from handler to prevent drag on double-click

---