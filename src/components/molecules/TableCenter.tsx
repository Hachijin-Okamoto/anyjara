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
        width: 100,
        height: 100,
        textAlign: 'center',
        color: '#666',
        background: 'white',
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid #eee',
        minWidth: 160,
        minHeight: 160,
        position: 'relative',
      }}
    >
      <div style={{ gap: 2, marginBottom: 10 }}>
        <div
          style={{
            transform: 'rotate(180deg)',
            color: turn === 2 ? '#d64545' : '#555',
            whiteSpace: 'nowrap',
          }}
        >
          P2: {scores[2]}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div style={{ color: '#666' }}>山: {wallCount}</div>
          <div style={{ color: '#666' }}>手番: P{turn}</div>
        </div>
        <div
          style={{
            color: turn === 0 ? '#d64545' : '#555',
            whiteSpace: 'nowrap',
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          P0: {scores[0]}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%) rotate(270deg)',
          color: turn === 3 ? '#d64545' : '#555',
          whiteSpace: 'nowrap',
        }}
      >
        P3: {scores[3]}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)',
          color: turn === 1 ? '#d64545' : '#555',
          whiteSpace: 'nowrap',
        }}
      >
        P1: {scores[1]}
      </div>
    </div>
  );
}
