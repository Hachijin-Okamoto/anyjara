import { type CSSProperties } from 'react';

import TileButton from '@/components/atoms/TileButton';
import { type Tile } from '@/entity/Tile';

type PlayerAreaProps = {
  label: string;
  handTiles?: Tile[];
  discards?: Tile[];
  direction: 'up' | 'down' | 'left' | 'right';
  showHandFaces?: boolean;
  tilesRotationDeg?: number;
  style?: CSSProperties;
};

export default function PlayerArea({
  label,
  handTiles,
  discards,
  direction,
  showHandFaces = true,
  style,
}: PlayerAreaProps) {
  const hasHandSection = handTiles !== undefined;
  const hasDiscardSection = discards !== undefined;
  const safeHandTiles = handTiles ?? [];
  const safeDiscards = discards ?? [];
  const handLimit = safeHandTiles.length;
  const discardLimit = safeDiscards.length;
  const tilesStyle: CSSProperties =
    direction === 'up' || direction === 'down'
      ? { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }
      : {
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          alignItems: 'center',
        };
  const tileWrapperStyle: CSSProperties = { transformOrigin: 'center' };

  if (direction === 'up') {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ color: '#555', textAlign: 'center' }}>{label}</div>
        {hasDiscardSection ? (
          <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <div style={tilesStyle}>
              {safeDiscards.slice(-discardLimit).map((t) => (
                <div key={t.id} style={tileWrapperStyle}>
                  <TileButton
                    tile={t}
                    disabled
                    scale={0.75}
                    direction={direction}
                    isHidden={!showHandFaces}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {hasHandSection ? (
          <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <div style={tilesStyle}>
              {safeHandTiles.slice(-handLimit).map((t) => (
                <div key={t.id} style={tileWrapperStyle}>
                  <TileButton
                    tile={t}
                    disabled
                    direction={direction}
                    isHidden={!showHandFaces}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  } else if (direction === 'down') {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ color: '#555', textAlign: 'center' }}>{label}</div>
        {hasHandSection ? (
          <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <div style={tilesStyle}>
              {safeHandTiles.slice(-handLimit).map((t) => (
                <div key={t.id} style={tileWrapperStyle}>
                  <TileButton
                    tile={t}
                    disabled
                    direction={direction}
                    isHidden={!showHandFaces}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {hasDiscardSection ? (
          <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <div style={tilesStyle}>
              {safeDiscards.slice(-discardLimit).map((t) => (
                <div key={t.id} style={tileWrapperStyle}>
                  <TileButton
                    tile={t}
                    disabled
                    direction={direction}
                    isHidden={!showHandFaces}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  } else if (direction === 'left') {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ color: '#555', textAlign: 'center' }}>{label}</div>
        <div style={{ display: 'flex' }}>
          {hasDiscardSection ? (
            <div
              style={{
                display: 'grid',
                gap: 6,
                justifyItems: 'center',
                marginRight: 350,
                marginTop: 120,
              }}
            >
              <div style={tilesStyle}>
                {safeDiscards.slice(-discardLimit).map((t) => (
                  <div key={t.id} style={tileWrapperStyle}>
                    <TileButton
                      tile={t}
                      disabled
                      direction={direction}
                      isHidden={!showHandFaces}
                      scale={0.75}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {hasHandSection ? (
            <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
              <div style={tilesStyle}>
                {safeHandTiles.slice(-handLimit).map((t) => (
                  <div key={t.id} style={tileWrapperStyle}>
                    <TileButton
                      tile={t}
                      disabled
                      direction={direction}
                      isHidden={!showHandFaces}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  } else {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ color: '#555', textAlign: 'center' }}>{label}</div>
        {hasHandSection ? (
          <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <div style={tilesStyle}>
              {safeHandTiles.slice(-handLimit).map((t) => (
                <div key={t.id} style={tileWrapperStyle}>
                  <TileButton
                    tile={t}
                    disabled
                    direction={direction}
                    isHidden={!showHandFaces}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {hasDiscardSection ? (
          <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <div style={tilesStyle}>
              {safeDiscards.slice(-discardLimit).map((t) => (
                <div key={t.id} style={tileWrapperStyle}>
                  <TileButton tile={t} disabled />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
