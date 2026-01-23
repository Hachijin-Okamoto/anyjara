import { type CSSProperties } from 'react';

import TileButton from '@/components/atoms/TileButton';
import { type Tile } from '@/entity/Tile';
import InsideWall from './InsideWall';

type PlayerAreaProps = {
  label: string;
  handTiles?: Tile[];
  discards?: Tile[];
  tsumoTile?: Tile;
  direction: 'up' | 'down' | 'left' | 'right';
  showHandFaces?: boolean;
  discardColumns?: number;
  canDiscard: boolean;
  allowedDiscardIds?: Set<string> | string[] | null;
  reachDiscardId?: string | null;
  onClick?: (tileId: string) => void;
  style?: CSSProperties;
};

export default function PlayerArea({
  handTiles,
  discards,
  tsumoTile,
  direction,
  showHandFaces = true,
  //discardColumns = 6,
  canDiscard,
  allowedDiscardIds,
  reachDiscardId,
  onClick,
  style,
}: PlayerAreaProps) {
  const hasHandSection = handTiles !== undefined;
  const hasTsumoTile = tsumoTile !== undefined;
  const safeHandTiles = handTiles ?? [];
  const safeDiscards = discards ?? [];
  const handLimit = safeHandTiles.length;
  //const discardLimit = safeDiscards.length;
  const tilesStyle: CSSProperties =
    direction === 'up' || direction === 'down'
      ? { display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }
      : {
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          alignItems: 'center',
        };
  const tileWrapperStyle: CSSProperties = { transformOrigin: 'center' };
  const allowedSet =
    allowedDiscardIds instanceof Set
      ? allowedDiscardIds
      : allowedDiscardIds
        ? new Set(allowedDiscardIds)
        : null;
  const isTileDisabled = (tileId: string) =>
    !canDiscard || (allowedSet ? !allowedSet.has(tileId) : false);

  if (direction === 'up') {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <InsideWall
            discards={safeDiscards}
            direction={direction}
            reachDiscardId={reachDiscardId}
          />
        </div>

        <div style={{ display: 'flex' }}>
          {hasHandSection ? (
            <div style={tilesStyle}>
              {safeHandTiles.slice(-handLimit).map((t) => (
                <TileButton
                  tile={t}
                  disabled={isTileDisabled(t.id)}
                  direction={direction}
                  isHidden={!showHandFaces}
                  onClick={() => onClick?.(t.id)}
                />
              ))}
            </div>
          ) : null}
          {hasTsumoTile ? (
            <div style={{ marginLeft: 10 }}>
              <TileButton
                tile={tsumoTile}
                disabled={isTileDisabled(tsumoTile.id)}
                direction={direction}
                isHidden={!showHandFaces}
                onClick={() => onClick?.(tsumoTile.id)}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  } else if (direction === 'down') {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ display: 'flex' }}>
          {hasTsumoTile ? (
            <div style={{ marginRight: 10 }}>
              <TileButton
                tile={tsumoTile}
                disabled={isTileDisabled(tsumoTile.id)}
                direction={direction}
                isHidden={!showHandFaces}
                onClick={() => onClick?.(tsumoTile.id)}
              />
            </div>
          ) : null}
          {hasHandSection ? (
            <div style={tilesStyle}>
              {safeHandTiles.slice(-handLimit).map((t) => (
                <TileButton
                  tile={t}
                  disabled={isTileDisabled(t.id)}
                  direction={direction}
                  isHidden={!showHandFaces}
                  onClick={() => onClick?.(t.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
        <InsideWall
          discards={safeDiscards}
          direction={direction}
          reachDiscardId={reachDiscardId}
        />
      </div>
    );
  } else if (direction === 'left') {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ display: 'flex' }}>
          <div style={{ position: 'absolute', right: 327, top: 140 }}>
            <InsideWall
              discards={safeDiscards}
              direction={direction}
              reachDiscardId={reachDiscardId}
            />
          </div>
          <div>
            {hasTsumoTile ? (
              <div style={{ marginBottom: 10 }}>
                <TileButton
                  tile={tsumoTile}
                  disabled
                  direction={direction}
                  isHidden={!showHandFaces}
                  onClick={() => onClick?.(tsumoTile.id)}
                />
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
      </div>
    );
  } else {
    return (
      <div
        style={{ ...style, display: 'grid', gap: 8, justifyItems: 'center' }}
      >
        <div style={{ display: 'flex' }}>
          <div>
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
            {hasTsumoTile ? (
              <div style={{ marginTop: 10 }}>
                <TileButton
                  tile={tsumoTile}
                  disabled
                  direction={direction}
                  isHidden={!showHandFaces}
                  onClick={() => onClick?.(tsumoTile.id)}
                />
              </div>
            ) : null}
          </div>
          <div style={{ position: 'absolute', left: 327, top: 140 }}>
            <InsideWall
              discards={safeDiscards}
              direction={direction}
              reachDiscardId={reachDiscardId}
            />
          </div>
        </div>
      </div>
    );
  }
}
