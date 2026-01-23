import { type CSSProperties } from 'react';

import TileButton from '@/components/atoms/TileButton';
import { type Tile } from '@entity/Tile';

type InsideWallProps = {
  discards: Tile[];
  direction: 'up' | 'down' | 'left' | 'right';
  turnLimit?: number;
  horizontalStyle?: CSSProperties;
  reachDiscardId?: string | null;
};

export default function InsideWall({
  discards,
  direction,
  turnLimit = 5,
  horizontalStyle,
  reachDiscardId,
}: InsideWallProps) {
  const hasDiscards = discards !== undefined;
  const safeDiscards = discards ?? [];
  const effectiveTurnLimit = Math.max(1, turnLimit);
  const rows: Tile[][] = [];

  for (let i = 0; i < safeDiscards.length; i += effectiveTurnLimit) {
    rows.push(safeDiscards.slice(i, i + effectiveTurnLimit));
  }

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

  const wallStyle: CSSProperties = {
    gap: 0,
    width: 190,
    height: 160,
    transform: `rotate(${rotateDeg}deg)`,
  };
  const rowStyle: CSSProperties = {
    display: 'flex',
    gap: 0,
  };

  const rotateStyle: CSSProperties = { transform: `rotate(${rotateDeg}deg)` };

  if (!hasDiscards) {
    return null;
  }

  return (
    <div
      style={{
        ...rotateStyle,
        ...(horizontalStyle ? horizontalStyle : wallStyle),
      }}
    >
      {rows.map((row, rowIndex) => (
        <div key={`discard-row-${rowIndex}`} style={rowStyle}>
          {row.map((tile) => (
            <TileButton
              key={tile.id}
              tile={tile}
              disabled
              direction={tile.id === reachDiscardId ? 'left' : 'up'}
              scale={0.75}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
