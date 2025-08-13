import { Stage } from '@pixi/react';
import { Application } from 'pixi.js';

export function Canvas() {
  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      options={{
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      }}
    >
      {/* Canvas content will go here */}
    </Stage>
  );
}