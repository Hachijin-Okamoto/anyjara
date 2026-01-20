import { type PlayerId } from '@/hooks/useGame';

type TableCenterProps = {
  wallCount: number;
  turn: PlayerId;
  scores: Record<PlayerId, number>;
};

export default function TableCenter({
  wallCount,
  turn,
  scores,
}: TableCenterProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#666',
        background: 'white',
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid #eee',
        minWidth: 160,
        minHeight: 140,
      }}
    >
      <div style={{ display: 'grid', gap: 2, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#666' }}>山: {wallCount}</div>
        <div style={{ fontSize: 12, color: '#666' }}>手番: P{turn}</div>
      </div>
      <div style={{ position: 'relative', height: 72 }}>
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%) rotate(180deg)',
            fontSize: 12,
            color: turn === 2 ? '#d64545' : '#555',
            whiteSpace: 'nowrap',
          }}
        >
          P2: {scores[2]}
        </div>
        <div
          style={{
            position: 'absolute',
            right: -8,
            top: '50%',
            transform: 'translateY(-50%) rotate(270deg)',
            fontSize: 12,
            color: turn === 3 ? '#d64545' : '#555',
            whiteSpace: 'nowrap',
          }}
        >
          P3: {scores[3]}
        </div>
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: '50%',
            transform: 'translateY(-50%) rotate(90deg)',
            fontSize: 12,
            color: turn === 1 ? '#d64545' : '#555',
            whiteSpace: 'nowrap',
          }}
        >
          P1: {scores[1]}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 12,
            color: turn === 0 ? '#d64545' : '#555',
            whiteSpace: 'nowrap',
          }}
        >
          P0: {scores[0]}
        </div>
      </div>
    </div>
  );
}
