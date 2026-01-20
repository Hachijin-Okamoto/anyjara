import ActionButton from '@/components/atoms/ActionButton';

type GameControlsProps = {
  canStart: boolean;
  wallCount: number;
  onStart: () => void;
};

export default function GameControls({
  canStart,
  wallCount,
  onStart,
}: GameControlsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <ActionButton onClick={onStart} disabled={!canStart}>
        Start Game
      </ActionButton>
      <div style={{ marginLeft: 'auto', color: '#333' }}>
        山: <b>{wallCount}</b>
      </div>
    </div>
  );
}
