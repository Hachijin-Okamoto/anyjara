import { type Tile } from '@/entity/Tile';

export default function TileButton({
  tile,
  disabled,
  isHidden,
  direction,
  scale = 1,
  onClick,
}: {
  tile: Tile;
  disabled?: boolean;
  isHidden?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  scale?: number;
  onClick?: () => void;
}) {
  const background = isHidden ? '#bdbdbd' : tile.colorCode;
  const borderColor = isHidden ? '#b0b0b0' : '#ddd';
  const textColor = isHidden ? '#6b6b6b' : '#fff';
  const label = isHidden ? '' : tile.label;
  const rotateDeg =
    direction === 'up'
      ? 0
      : direction === 'down'
        ? 180
        : direction === 'left'
          ? -90
          : direction === 'right'
            ? 90
            : 0;
  const fixedWidth =
    direction === 'up' || direction === 'down' ? 50 * scale : 70 * scale;
  const fixedHeight =
    direction === 'up' || direction === 'down' ? 70 * scale : 50 * scale;
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={isHidden ? 'hidden' : tile.id}
      style={{
        width: fixedWidth,
        height: fixedHeight,
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background,
        padding: 0,
        margin: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        userSelect: 'none',
        color: textColor,
        textAlign: 'center',
        lineHeight: 1,
        textShadow: isHidden ? 'none' : '0 1px 1px rgba(0,0,0,0.35)',
      }}
    >
      <span
        style={{ transform: `rotate(${rotateDeg}deg)`, fontSize: 16 * scale }}
      >
        {label}
      </span>
    </button>
  );
}
