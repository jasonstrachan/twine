import { Graphics } from '@pixi/react';
import { useCallback } from 'react';
import { useBlocksStore } from '../stores/blocksStore';
import { useConnectionsStore } from '../stores/connectionsStore';

export function ConnectionLayer() {
  const blocks = useBlocksStore((state) => state.blocks);
  const connections = useConnectionsStore((state) => state.connections);
  
  const drawConnections = useCallback((g: any) => {
    g.clear();
    
    connections.forEach((connection) => {
      const fromBlock = blocks.find(b => b.id === connection.from);
      const toBlock = blocks.find(b => b.id === connection.to);
      
      if (!fromBlock || !toBlock) return;
      
      // Calculate connection points (center of blocks)
      const fromX = fromBlock.position.x + fromBlock.size.width / 2;
      const fromY = fromBlock.position.y + fromBlock.size.height / 2;
      const toX = toBlock.position.x + toBlock.size.width / 2;
      const toY = toBlock.position.y + toBlock.size.height / 2;
      
      // Draw curved connection
      g.setStrokeStyle({ width: 2, color: 0x666666, alpha: 0.8 });
      g.moveTo(fromX, fromY);
      
      // Calculate control points for bezier curve
      const distance = Math.abs(toX - fromX);
      const controlOffset = Math.min(distance * 0.5, 100);
      
      g.bezierCurveTo(
        fromX + controlOffset, fromY,
        toX - controlOffset, toY,
        toX, toY
      );
      
      g.stroke();
      
      // Draw arrow at the end
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowSize = 10;
      
      g.beginPath();
      g.moveTo(toX, toY);
      g.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      g.moveTo(toX, toY);
      g.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      g.stroke();
    });
  }, [connections, blocks]);
  
  return <Graphics draw={drawConnections} />;
}