import { create } from 'zustand';
import { Viewport } from 'pixi-viewport';

interface CanvasState {
  viewport: Viewport | null;
  mouseWorldPos: { x: number; y: number };
  zoom: number;
  setViewport: (viewport: Viewport) => void;
  updateMouseWorldPos: (x: number, y: number) => void;
  updateZoom: (zoom: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  viewport: null,
  mouseWorldPos: { x: 0, y: 0 },
  zoom: 1,
  setViewport: (viewport) => set({ viewport }),
  updateMouseWorldPos: (x, y) => set({ mouseWorldPos: { x, y } }),
  updateZoom: (zoom) => set({ zoom }),
}));