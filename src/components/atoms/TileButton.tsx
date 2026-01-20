import { type Tile } from '@/entity/Tile';

export default function TileButton({
  tile,
  disabled,
  onClick,
}: {
  tile: Tile;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={tile.id}
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        border: '1px solid #ddd',
        background: tile.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        userSelect: 'none',
        color: '#fff',
        textShadow: '0 1px 1px rgba(0,0,0,0.35)',
      }}
    >
      {tile.label}
    </button>
  );
}
