import { type PlayerId } from '@/hooks/useGame';

type TableCenterProps = {
  wallCount: number;
  turn: PlayerId;
};

export default function TableCenter({ wallCount, turn }: TableCenterProps) {
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
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Table Center</div>
      <div>山: {wallCount}</div>
      <div>手番: P{turn}</div>
    </div>
  );
}
