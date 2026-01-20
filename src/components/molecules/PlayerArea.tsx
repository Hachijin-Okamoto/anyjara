import { type CSSProperties } from 'react';

import TileButton from '@/components/atoms/TileButton';
import { type Tile } from '@/entity/Tile';

type PlayerAreaProps = {
  label: string;
  discards: Tile[];
  maxTiles: number;
  direction: 'row' | 'column';
  style?: CSSProperties;
};

export default function PlayerArea({
  label,
  discards,
  maxTiles,
  direction,
  style,
}: PlayerAreaProps) {
  const tilesStyle: CSSProperties =
    direction === 'row'
      ? { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }
      : { display: 'grid', gap: 6 };

  return (
    <div style={style}>
      <div style={{ color: '#555', textAlign: 'center', marginBottom: 6 }}>
        {label}
      </div>
      <div style={tilesStyle}>
        {discards.slice(-maxTiles).map((t) => (
          <TileButton key={t.id} tile={t} disabled />
        ))}
      </div>
    </div>
  );
}
