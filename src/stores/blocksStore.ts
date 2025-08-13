import { create } from 'zustand';
import type { Block, TextBlock, ImageBlock } from '../types/canvas';

interface BlocksState {
  blocks: Block[];
  selectedBlockIds: Set<string>;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  selectBlock: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  moveBlock: (id: string, x: number, y: number) => void;
  resizeBlock: (id: string, width: number, height: number) => void;
}

export const useBlocksStore = create<BlocksState>((set) => ({
  blocks: [],
  selectedBlockIds: new Set(),
  
  addBlock: (block) => set((state) => ({
    blocks: [...state.blocks, block],
  })),
  
  updateBlock: (id, updates) => set((state) => ({
    blocks: state.blocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    ),
  })),
  
  deleteBlock: (id) => set((state) => ({
    blocks: state.blocks.filter((block) => block.id !== id),
    selectedBlockIds: new Set([...state.selectedBlockIds].filter(bid => bid !== id)),
  })),
  
  selectBlock: (id, multi = false) => set((state) => {
    const newSelected = new Set(multi ? state.selectedBlockIds : []);
    if (multi && newSelected.has(id)) {
      // Deselect if already selected in multi mode
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return { 
      selectedBlockIds: newSelected,
      blocks: state.blocks.map(block => ({
        ...block,
        selected: newSelected.has(block.id)
      }))
    };
  }),
  
  deselectAll: () => set((state) => ({
    selectedBlockIds: new Set(),
    blocks: state.blocks.map(block => ({ ...block, selected: false }))
  })),
  
  moveBlock: (id, x, y) => set((state) => ({
    blocks: state.blocks.map((block) =>
      block.id === id ? { ...block, position: { x, y } } : block
    ),
  })),
  
  resizeBlock: (id, width, height) => set((state) => ({
    blocks: state.blocks.map((block) =>
      block.id === id ? { ...block, size: { width: Math.max(50, width), height: Math.max(50, height) } } : block
    ),
  })),
}));

// Helper to create a new text block
export function createTextBlock(x: number, y: number, text: string = 'New Note'): TextBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    content: {
      text: text || 'New Note',
      fontSize: 16,
      color: '#ffffff',
    },
    position: { x, y },
    size: { width: Math.max(200, 100), height: Math.max(100, 50) }, // Ensure minimum sizes
    selected: false,
    locked: false,
    visible: true,
  };
}

// Helper to create a new image block
export function createImageBlock(x: number, y: number, url: string, width: number = 300, height: number = 200): ImageBlock {
  // Ensure minimum sizes to avoid rendering issues
  const safeWidth = Math.max(width, 50);
  const safeHeight = Math.max(height, 50);
  
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'image',
    content: {
      url,
      originalSize: { width: safeWidth, height: safeHeight },
    },
    position: { x, y },
    size: { width: safeWidth, height: safeHeight },
    selected: false,
    locked: false,
    visible: true,
  };
}