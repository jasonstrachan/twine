import { create } from 'zustand';
import type { Connection } from '../types/canvas';

interface ConnectionsState {
  connections: Connection[];
  connectionMode: boolean;
  connectingFrom: string | null;
  addConnection: (from: string, to: string) => void;
  deleteConnection: (id: string) => void;
  setConnectionMode: (enabled: boolean) => void;
  setConnectingFrom: (blockId: string | null) => void;
  getBlockConnections: (blockId: string) => Connection[];
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  connections: [],
  connectionMode: false,
  connectingFrom: null,
  
  addConnection: (from, to) => {
    // Don't connect block to itself
    if (from === to) return;
    
    // Check if connection already exists
    const exists = get().connections.some(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    
    if (!exists) {
      set((state) => ({
        connections: [...state.connections, {
          id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          from,
          to,
          type: 'curved'
        }],
        connectingFrom: null,
        connectionMode: false
      }));
    }
  },
  
  deleteConnection: (id) => set((state) => ({
    connections: state.connections.filter(c => c.id !== id)
  })),
  
  setConnectionMode: (enabled) => set({ 
    connectionMode: enabled,
    connectingFrom: enabled ? null : get().connectingFrom
  }),
  
  setConnectingFrom: (blockId) => set({ connectingFrom: blockId }),
  
  getBlockConnections: (blockId) => {
    return get().connections.filter(c => c.from === blockId || c.to === blockId);
  }
}));