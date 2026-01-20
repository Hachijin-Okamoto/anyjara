import { useState } from 'react';

import ActionButton from '@/components/atoms/ActionButton';
import TileButton from '@/components/atoms/TileButton';
import PlayerArea from '@/components/molecules/PlayerArea';
import TableCenter from '@/components/molecules/TableCenter';
import {
  type GameState,
  type PlayerId,
  type YakuEvaluation,
} from '@/hooks/useGame';

type TableBoardProps = {
  state: GameState;
  humanId: PlayerId;
  canDiscard: boolean;
  onDiscard: (tileId: string) => void;
  evaluation: YakuEvaluation;
  winTarget: number;
};

export default function TableBoard({
  state,
  humanId,
  canDiscard,
  onDiscard,
}: TableBoardProps) {
  const [showOpponentHands, setShowOpponentHands] = useState(false);
  const lastTsumoId = state.lastTsumo[humanId];
  const hand = state.hands[humanId];
  const drawnTile = lastTsumoId
    ? hand.find((t) => t.id === lastTsumoId)
    : undefined;
  const _baseHand = drawnTile ? hand.filter((t) => t.id !== lastTsumoId) : hand;
  console.log(_baseHand);
  const scores = { 0: 0, 1: 0, 2: 0, 3: 0 } as const;

  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 16,
        padding: 14,
        background: 'white',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>Table</h2>
        <ActionButton onClick={() => setShowOpponentHands((prev) => !prev)}>
          {showOpponentHands
            ? '他プレイヤー手牌を非表示'
            : '他プレイヤー手牌を表示'}
        </ActionButton>
      </div>

      <div
        style={{
          position: 'relative',
          height: 640,
          width: 'min(96vw, 1200px)',
          margin: '0 auto',
          borderRadius: 18,
          background:
            'radial-gradient(circle at center, #f8f8f8 0%, #f2f2f2 65%, #ededed 100%)',
          border: '1px solid #eee',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 40,
            borderRadius: '50%',
            border: '1px dashed #ddd',
          }}
        />

        <PlayerArea
          label="P2"
          handTiles={state.hands[2]}
          discards={state.discards[2]}
          direction="down"
          showHandFaces={showOpponentHands}
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <PlayerArea
            label="P3"
            handTiles={state.hands[3]}
            discards={state.discards[3]}
            direction="left"
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <PlayerArea
            label="P1 手牌"
            handTiles={state.hands[1]}
            direction="right"
            showHandFaces={showOpponentHands}
            tilesRotationDeg={90}
          />
          <PlayerArea
            label="P1 捨て牌"
            discards={state.discards[1]}
            direction="right"
            tilesRotationDeg={90}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <PlayerArea
            label="P0（あなた）"
            handTiles={state.hands[0]}
            discards={state.discards[0]}
            direction="up"
          />
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'nowrap',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'center',
                flex: 1,
              }}
            ></div>
            {drawnTile ? (
              <div style={{ marginLeft: 12 }}>
                <TileButton
                  tile={drawnTile}
                  disabled={!canDiscard}
                  direction="up"
                  onClick={() => onDiscard(drawnTile.id)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <TableCenter
          wallCount={state.wall.length}
          turn={state.turn}
          scores={scores}
        />
      </div>
    </section>
  );
}
