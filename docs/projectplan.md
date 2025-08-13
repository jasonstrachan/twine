# Twine - Implementation Plan

## Tech Stack

### Frontend Setup
```bash
# Create Vite + React app
pnpm create vite@latest twine --template react-ts
cd twine

# Core dependencies
pnpm add pixi.js @pixi/react           # WebGL canvas
pnpm add pixi-viewport                 # Figma-like pan/zoom
pnpm add zustand immer                 # State management
pnpm add @radix-ui/themes              # UI components
pnpm add tailwindcss                   # Styling

# AI & Backend
pnpm add @anthropic-ai/sdk openai      # AI services
pnpm add socket.io-client              # Real-time sync
```

### Canvas Architecture (Figma-style)
```typescript
// Separate world space from screen space
interface ViewTransform {
  scale: number;      // Zoom level (1.0 = 100%)
  offsetX: number;    // Pan position X
  offsetY: number;    // Pan position Y
}

// Using pixi-viewport for proper world/screen separation
import { Viewport } from 'pixi-viewport';

const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: 10000,
  worldHeight: 10000,
  interaction: app.renderer.plugins.interaction
});

// Enable Figma-like controls
viewport
  .drag()           // Pan with mouse
  .pinch()         // Pinch zoom on mobile
  .wheel()         // Scroll wheel zoom
  .decelerate();   // Momentum scrolling

// Convert between coordinate spaces
function screenToWorld(x: number, y: number) {
  return viewport.toWorld(x, y);
}

function worldToScreen(x: number, y: number) {
  return viewport.toScreen(x, y);
}
```

### Rendering Optimization
```typescript
// PixiJS automatically optimizes with:
const app = new PIXI.Application({
  antialias: true,
  resolution: window.devicePixelRatio,
  autoDensity: true,  // Handles retina displays
  powerPreference: 'high-performance'
});

// For complex groups, use cacheAsBitmap
container.cacheAsBitmap = true;  // Renders to texture once

// Or RenderTexture for manual control
const renderTexture = PIXI.RenderTexture.create({ width: 1024, height: 1024 });
app.renderer.render(container, { renderTexture });
```

## Backend Services

### Docker Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: twine
      POSTGRES_PASSWORD: twine
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Environment Variables
```env
# .env.local
VITE_ANTHROPIC_KEY=sk-ant-...
VITE_OPENAI_KEY=sk-...
VITE_WS_URL=ws://localhost:8000
DATABASE_URL=postgresql://postgres:twine@localhost:5432/twine
```

## Project Structure
```
twine/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx       # PixiJS infinite canvas
│   │   ├── Block.tsx        # Content blocks
│   │   ├── Connector.tsx    # Visual links
│   │   ├── Chat.tsx         # AI assistant
│   │   ├── Layers/          # Figma-style layers panel
│   │   │   ├── LayersPanel.tsx
│   │   │   ├── LayerItem.tsx     # Show/hide/lock controls
│   │   │   └── PageTabs.tsx      # Switch between pages
│   │   └── Layout.tsx       # Main app layout
│   ├── stores/
│   │   ├── canvas.ts        # Canvas state & layers
│   │   └── pages.ts         # Multiple pages/projects
│   └── lib/
│       ├── ai.ts            # AI service calls
│       └── db.ts            # Database queries
```

## Data Models

```typescript
interface CanvasBlock {
  id: string;
  type: 'text' | 'image' | 'drawing' | 'voice';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  connections: string[];  // Block IDs
}

interface Page {
  id: string;
  name: string;
  layers: Layer[];
  lastModified: Date;
}

interface Layer {
  id: string;
  name: string;
  type: 'group' | 'block';
  visible: boolean;
  locked: boolean;
  children?: Layer[];  // For groups
  blockId?: string;    // For block layers
  expanded: boolean;   // For groups in sidebar
}
```

## AI Services Integration

### Service Configuration
```typescript
// lib/ai.ts
import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';

const claude = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_KEY
});

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY
});

// Voice transcription
export async function transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append('file', audioBlob);
  formData.append('model', 'whisper-1');
  
  const response = await openai.audio.transcriptions.create({
    file: audioBlob,
    model: 'whisper-1'
  });
  
  return response.text;
}

// Chat with context
export async function chatWithClaude(
  message: string, 
  context: CanvasBlock[]
) {
  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Context: ${JSON.stringify(context)}\n\nUser: ${message}`
    }],
    max_tokens: 1000
  });
  
  return response.content[0].text;
}
```

### Pricing Calculations
- **Claude 3.5 Sonnet**: $3/$15 per M tokens
- **Whisper API**: $0.006/minute
- **OpenAI Embeddings**: $0.13/M tokens

**Per User Costs:**
- Light (10 sessions): ~$3-5/month
- Active (50 sessions): ~$15-20/month
- Power (200+ sessions): ~$60-80/month

## Build Phases with Validation Checkpoints

### Phase 1: Core Canvas (Days 1-3)

#### Day 1: Project Setup
```bash
# Morning
- [ ] Create Vite + React + TypeScript project
- [ ] Install PixiJS + pixi-viewport
- [ ] Basic folder structure
✓ CHECKPOINT: Dev server runs, blank canvas renders

# Afternoon  
- [ ] Create Canvas component with PixiJS stage
- [ ] Implement viewport with pan/zoom
- [ ] Add debug overlay showing world coordinates
✓ CHECKPOINT: Can pan/zoom infinite canvas with mouse
```

#### Day 2: Basic Blocks
```bash
# Morning
- [ ] Create Block class/component
- [ ] Implement text blocks (just rectangles with text)
- [ ] Add block to canvas on double-click
✓ CHECKPOINT: Can create text blocks on canvas

# Afternoon
- [ ] Drag and drop for blocks
- [ ] Block selection with outline
- [ ] Delete selected block (Delete key)
✓ CHECKPOINT: Full CRUD for text blocks
```

#### Day 3: Image Support
```bash
# Morning
- [ ] Image paste handler (Ctrl+V)
- [ ] Image block type with loading state
- [ ] Resize handles on selection
✓ CHECKPOINT: Can paste and resize images

# Afternoon
- [ ] Multi-select with Shift+click or drag box
- [ ] Group selected blocks (Ctrl+G)
- [ ] Move groups as one unit
✓ CHECKPOINT: Basic canvas is functional
```

### Phase 2: Connections & Interactions (Days 4-6)

#### Day 4: Visual Connections
```bash
# Morning
- [ ] Connection mode (hold Shift)
- [ ] Draw line while dragging
- [ ] Create connection on release
✓ CHECKPOINT: Can connect two blocks visually

# Afternoon
- [ ] Curved bezier connections
- [ ] Connection hover states
- [ ] Delete connections
✓ CHECKPOINT: Professional-looking connections
```

#### Day 5: Drawing Tools
```bash
# Morning
- [ ] Freehand drawing mode
- [ ] Basic brush with color picker
- [ ] Drawing as separate layer
✓ CHECKPOINT: Can draw on canvas

# Afternoon
- [ ] Draw on images (annotation mode)
- [ ] Eraser tool
- [ ] Save drawings as blocks
✓ CHECKPOINT: Full annotation system works
```

#### Day 6: UI Chrome
```bash
# Morning
- [ ] Header with search bar
- [ ] Left sidebar with layers panel
- [ ] Show/hide layers (eye icon)
✓ CHECKPOINT: UI layout matches Figma

# Afternoon
- [ ] Layer reordering via drag
- [ ] Expand/collapse groups
- [ ] Right panel for properties
✓ CHECKPOINT: Complete UI shell
```

### Phase 3: AI Integration (Days 7-9)

#### Day 7: Chat Interface
```bash
# Morning
- [ ] Chat panel UI (collapsible)
- [ ] Message history display
- [ ] Input with send button
✓ CHECKPOINT: Chat UI works (mock responses)

# Afternoon
- [ ] Integrate Claude SDK
- [ ] Send messages to Claude
- [ ] Display responses
✓ CHECKPOINT: Can chat with Claude
```

#### Day 8: Context-Aware AI
```bash
# Morning
- [ ] Pass selected blocks as context
- [ ] "Ask about selection" button
- [ ] Format context for Claude
✓ CHECKPOINT: AI knows about canvas content

# Afternoon
- [ ] AI commands (/organize, /connect)
- [ ] Apply AI suggestions to canvas
- [ ] Undo AI actions
✓ CHECKPOINT: AI can modify canvas
```

#### Day 9: Voice Input
```bash
# Morning
- [ ] Voice record button
- [ ] Audio waveform visualization
- [ ] Send to Whisper API
✓ CHECKPOINT: Voice transcription works

# Afternoon
- [ ] Create text block from voice
- [ ] Voice commands ("connect these")
- [ ] Continuous listening mode
✓ CHECKPOINT: Voice-first interaction complete
```

### Phase 4: Polish & Persistence (Days 10-12)

#### Day 10: Data Persistence
```bash
# Morning
- [ ] Setup PostgreSQL with Docker
- [ ] Drizzle ORM schemas
- [ ] Save canvas state endpoint
✓ CHECKPOINT: Can save to database

# Afternoon
- [ ] Load canvas on refresh
- [ ] Auto-save every 30 seconds
- [ ] Version history
✓ CHECKPOINT: Full persistence works
```

#### Day 11: Performance
```bash
# Morning
- [ ] Implement viewport culling
- [ ] CacheAsBitmap for complex groups
- [ ] Texture atlasing for images
✓ CHECKPOINT: 60fps with 500+ blocks

# Afternoon
- [ ] Lazy load off-screen content
- [ ] WebWorker for AI calls
- [ ] Debounce/throttle interactions
✓ CHECKPOINT: Smooth under load
```

#### Day 12: Final Polish
```bash
# Morning
- [ ] Keyboard shortcuts guide
- [ ] Onboarding tour
- [ ] Error boundaries
✓ CHECKPOINT: Production-ready UX

# Afternoon
- [ ] Export to PNG/PDF
- [ ] Share links
- [ ] Deploy to Vercel
✓ CHECKPOINT: Live on the web!
```

## Daily Validation Checklist

After each checkpoint, verify:
```bash
# Functionality
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Handles edge cases

# Performance  
- [ ] 60fps during interactions
- [ ] <100ms response to input
- [ ] Memory usage stable

# Code Quality
- [ ] TypeScript types complete
- [ ] Components are reusable
- [ ] State management clean

# User Experience
- [ ] Intuitive without instructions
- [ ] Visual feedback for all actions
- [ ] Undo/redo works
```

## Quick Test Commands

```bash
# After each checkpoint
pnpm dev         # Should start without errors
pnpm type-check  # No TypeScript errors
pnpm build       # Production build works

# Performance check
console.log(app.ticker.FPS)  # Should be ~60

# Memory check
performance.memory.usedJSHeapSize / 1048576  # MB used
```

## Development Commands

```bash
# Initial setup
git clone [repo]
cd twine
pnpm install

# Start services
docker-compose up -d

# Run dev server
pnpm dev  # http://localhost:3000

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Performance Targets
- Canvas render: 60fps with 1000+ objects
- AI response: <2 seconds
- Voice transcription: <3 seconds
- Search results: <500ms
- Initial load: <2 seconds
- HMR update: <100ms

## Testing Strategy
- Unit tests for state management
- Integration tests for AI services
- E2E tests for canvas interactions
- Performance benchmarks for rendering
- Load testing for concurrent users