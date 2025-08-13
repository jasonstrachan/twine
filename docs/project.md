# Twine - Project Overview

## What is Twine?
Twine is an infinite canvas for organizing thoughts, images, and ideas with AI assistance. Think Figma meets Obsidian - a living graph where you can paste images, draw annotations, connect ideas with visual links, and have AI help organize everything.

## Core Features

### The Canvas
- **Infinite workspace** - Pan, zoom, no boundaries
- **Everything is a block** - Text, images, drawings, voice memos, web clips
- **Visual connections** - Drag between blocks to create relationships
- **Physics-based** - Blocks attract/repel, connections have spring physics
- **Draw anywhere** - Annotate images, sketch ideas, highlight regions

### AI Integration
- **Chat assistant** - Context-aware help based on selected content
- **Voice capture** - Whisper transcription direct to canvas
- **Auto-organization** - AI suggests connections and groupings
- **Smart search** - Natural language queries across all content

### UI Layout
- **Left Sidebar** - Layers panel (Figma-style)
  - Pages/Projects tabs at top
  - Layers tree showing canvas hierarchy
  - Groups expand/collapse with arrow
  - Eye icon to show/hide layers
  - Lock icon to prevent editing
  - Search within layers
  - Drag to reorder or nest
- **Center** - Infinite canvas workspace
- **Header** - Search bar, user menu
- **Right Panel** - AI chat + properties

### Key Interactions
- **Paste anything** - Images, text, URLs auto-create appropriate blocks
- **Shift+drag** - Connect any two blocks
- **Double-click image** - Enter annotation mode
- **Group anything** - Multi select and Ctrl+G 
- **Cmd+Space** - Open AI chat
- **Drag multiple images** - Shift select multiple, auto-arrange as moodboard

## Use Cases

### Personal
- **Visual journaling** - Combine photos, thoughts, and sketches
- **Research organization** - Connect articles, images, and notes
- **Creative moodboards** - Collect inspiration with annotations
- **Study notes** - Link concepts visually

### Professional
- **Design exploration** - Rapid ideation with references
- **Project planning** - Visual task organization
- **Meeting notes** - Voice transcription with visual aids
- **Knowledge management** - Build personal wikis

## What Makes Twine Different
- **AI-native from the start** - Not bolted on, but core to the experience
- **Focus on thought organization** vs design tools
- **Living graph with physics** - Your ideas have weight and relationships
- **Voice-first input option** - Think out loud, organize visually
- **Automatic relationship discovery** - AI finds hidden connections

## Similar Products
- **Figma**: Design tool with infinite canvas (we borrow their viewport approach)
- **Miro/Mural**: Collaborative whiteboards (less AI, more templates)
- **Obsidian Canvas**: Note-taking with visual links (less visual, more text)
- **Milanote**: Moodboard creation (less connected, more static)

## Target Users
- **Creative professionals** who think visually
- **Researchers** organizing complex information
- **Students** building knowledge maps
- **Anyone** who thinks better with spatial organization

## Pricing Model
- **Free Tier**: 10 AI interactions/day, basic features
- **Pro ($15/month)**: Unlimited AI, voice transcription
- **Team ($25/month)**: Collaboration, admin controls

## Success Metrics
- User can go from idea to organized canvas in <5 minutes
- 60fps performance with 1000+ objects on screen
- AI responses feel instant (<2 seconds)
- Daily active usage from engaged users

## Vision
Twine becomes the default way people organize their thoughts - replacing linear documents with spatial, connected thinking. Every idea has a place, every connection is visible, and AI helps you see patterns you'd miss.

## Development Documentation

### PixiJS v8 Documentation
Comprehensive documentation for PixiJS v8 has been added to `/docs/pixijs/`:

- **[Getting Started](./pixijs/getting-started.md)** - Installation and basic setup
- **[Migration Guide](./pixijs/migration-guide-v8.md)** - Complete v7 to v8 migration instructions
- **[Graphics API](./pixijs/graphics-api.md)** - New graphics drawing system
- **[Containers](./pixijs/containers.md)** - Display object hierarchy and management
- **[Assets & Textures](./pixijs/assets-and-textures.md)** - Modern asset loading system
- **[Events System](./pixijs/events-system.md)** - New eventMode system and interaction handling

Key v8 changes for Twine development:
- All applications require async initialization with `await app.init()`
- Graphics API completely redesigned with simpler, chainable methods
- New Assets system with Promise-based loading and built-in caching
- Improved event system with better performance and cross-platform support