import { Container } from '@pixi/react';
import { Block } from './Block';
import { useBlocksStore } from '../stores/blocksStore';
import { useCanvasStore } from '../stores/canvasStore';

export function ViewportContent() {
  const blocks = useBlocksStore((state) => state.blocks);
  const viewport = useCanvasStore((state) => state.viewport);

  if (!viewport) return null;

  return (
    <Container>
      {blocks.map((block) => (
        <Block key={block.id} block={block} viewport={viewport} />
      ))}
    </Container>
  );
}