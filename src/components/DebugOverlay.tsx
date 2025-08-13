import { useCanvasStore } from '../stores/canvasStore';
import { useBlocksStore } from '../stores/blocksStore';

export function DebugOverlay() {
  const { mouseWorldPos, zoom } = useCanvasStore();
  const blocks = useBlocksStore((state) => state.blocks);

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#00ff00',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      <div>World X: {mouseWorldPos.x.toFixed(0)}</div>
      <div>World Y: {mouseWorldPos.y.toFixed(0)}</div>
      <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
      <div style={{ marginTop: '10px', color: '#ffff00' }}>
        <div>Blocks: {blocks.length}</div>
        {blocks.length > 0 && (
          <>
            <div>Last block:</div>
            <div style={{ fontSize: '10px' }}>
              {blocks[blocks.length - 1].type} at ({Math.round(blocks[blocks.length - 1].position.x)}, {Math.round(blocks[blocks.length - 1].position.y)})
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: '10px', color: '#888' }}>
        <div>Pan: Click + Drag</div>
        <div>Zoom: Scroll Wheel</div>
        <div>New Block: Double-click</div>
        <div>Paste: Ctrl+V (text/image)</div>
        <div>Connect: Shift+Click blocks</div>
        <div>Delete: Delete key</div>
      </div>
    </div>
  );
}