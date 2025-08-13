export interface Block {
  id: string;
  type: 'text' | 'image' | 'drawing' | 'voice';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  selected: boolean;
  locked: boolean;
  visible: boolean;
  connections?: string[]; // IDs of connected blocks
}

export interface Connection {
  id: string;
  from: string; // Block ID
  to: string;   // Block ID
  type: 'straight' | 'curved';
}

export interface TextBlock extends Block {
  type: 'text';
  content: {
    text: string;
    fontSize: number;
    color: string;
  };
}

export interface ImageBlock extends Block {
  type: 'image';
  content: {
    url: string;
    originalSize: { width: number; height: number };
  };
}