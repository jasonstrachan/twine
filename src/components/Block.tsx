import { Container, Graphics, Text } from '@pixi/react';
import { TextStyle } from 'pixi.js';
import type { Block as BlockType } from '../types/canvas';
import { useCallback, useState } from 'react';
import { useBlocksStore } from '../stores/blocksStore';

interface BlockProps {
  block: BlockType;
  viewport: any;
}

export function Block({ block, viewport }: BlockProps) {
  const { selectBlock, moveBlock } = useBlocksStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    selectBlock(block.id, e.data.originalEvent.shiftKey);
    
    const global = e.data.global;
    const world = viewport.toWorld(global.x, global.y);
    setDragStart({
      x: world.x - block.position.x,
      y: world.y - block.position.y,
    });
    setIsDragging(true);
  }, [block, selectBlock, viewport]);

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging) return;
    
    const global = e.data.global;
    const world = viewport.toWorld(global.x, global.y);
    moveBlock(block.id, world.x - dragStart.x, world.y - dragStart.y);
  }, [isDragging, dragStart, block.id, moveBlock, viewport]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const drawBackground = useCallback((g: any) => {
    g.clear();
    
    // Background
    g.roundRect(0, 0, block.size.width, block.size.height, 8);
    g.fill(0x2a2a2a);
    
    // Selection outline
    if (block.selected) {
      g.setStrokeStyle({ width: 2, color: 0x00aaff, alpha: 1 });
      g.roundRect(-2, -2, block.size.width + 4, block.size.height + 4, 8);
      g.stroke();
    }
  }, [block.size, block.selected]);

  return (
    <Container
      x={block.position.x}
      y={block.position.y}
      interactive={true}
      cursor="pointer"
      pointerdown={handlePointerDown}
      pointermove={handlePointerMove}
      pointerup={handlePointerUp}
      pointerupoutside={handlePointerUp}
    >
      <Graphics draw={drawBackground} />
      
      {block.type === 'text' && (
        <Text
          text={block.content.text}
          x={10}
          y={10}
          style={
            new TextStyle({
              fontSize: block.content.fontSize,
              fill: block.content.color,
              wordWrap: true,
              wordWrapWidth: block.size.width - 20,
            })
          }
        />
      )}
    </Container>
  );
}