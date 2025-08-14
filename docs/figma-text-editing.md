# Figma-Style Text Editing Pattern

## How Figma Handles Text Editing

### Selection States
1. **No Selection**: Text box has no visual indicators
2. **Selected (not editing)**: 
   - Blue border around text box
   - Resize handles on all 4 corners
   - Can be dragged/moved
3. **Edit Mode**:
   - Blue border remains but becomes thinner
   - Resize handles disappear
   - Text cursor appears
   - Text is directly editable
   - Background may have subtle tint

### Interaction Flow
1. **Single Click** → Select text box (shows handles)
2. **Double Click** or **Press Enter** → Enter edit mode
3. **In Edit Mode**:
   - Type to edit text
   - Click outside to commit changes
   - Press Escape to cancel changes
4. **Exit Edit Mode** → Returns to selected state

### Key Behaviors
- **Seamless transition**: Text doesn't jump or flicker
- **Visual feedback**: Clear indication of edit mode vs selection
- **Keyboard shortcuts**: Enter to edit, Escape to cancel
- **Click outside**: Commits changes and exits edit mode
- **Real-time updates**: Text updates as you type

### Implementation Strategy
1. Use invisible textarea overlay for actual input
2. Keep PIXI text visible and update in real-time
3. Hide handles during edit mode
4. Change border style to indicate edit mode
5. Handle click-outside to exit edit mode