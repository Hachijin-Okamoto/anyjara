import { useState } from 'react';

import ActionButton from '@/components/atoms/ActionButton';
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
  canDiscard,
  onDiscard,
}: TableBoardProps) {
  const [showOpponentHands, setShowOpponentHands] = useState(false);

  const handResults: {
    lastTsumoId: string | null;
    hand: (typeof state.hands)[PlayerId];
    tsumoTile: (typeof state.hands)[PlayerId][number] | undefined;
    baseHand: (typeof state.hands)[PlayerId];
  }[] = [0, 1, 2, 3].map((playerId) => {
    const lastTsumoId = state.lastTsumo[playerId as PlayerId];
    const hand = state.hands[playerId as PlayerId];
    const tsumoTile = lastTsumoId
      ? hand.find((t) => t.id === lastTsumoId)
      : undefined;
    const baseHand = tsumoTile
      ? hand.filter((t) => t.id !== lastTsumoId)
      : hand;
    return { lastTsumoId, hand, tsumoTile, baseHand };
  });

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
          width: 'min(96vw, 1200px)',
          margin: '0 auto',
          padding: 10,
          borderRadius: 18,
          background:
            'radial-gradient(circle at center, #f8f8f8 0%, #f2f2f2 65%, #ededed 100%)',
          border: '1px solid #eee',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 140 }}>
          <PlayerArea
            label="P1"
            handTiles={handResults[1].baseHand}
            discards={state.discards[1]}
            tsumoTile={handResults[1].tsumoTile}
            direction="right"
            showHandFaces={showOpponentHands}
            canDiscard={false}
          />
        </div>
        <div style={{ position: 'absolute', right: 0, top: 140 }}>
          <PlayerArea
            label="P3"
            handTiles={handResults[3].baseHand}
            discards={state.discards[3]}
            tsumoTile={handResults[3].tsumoTile}
            direction="left"
            showHandFaces={showOpponentHands}
            canDiscard={false}
          />
        </div>
        <div style={{ display: 'grid' }}>
          <PlayerArea
            label="P2"
            handTiles={handResults[2].baseHand}
            discards={state.discards[2]}
            tsumoTile={handResults[2].tsumoTile}
            direction="down"
            showHandFaces={showOpponentHands}
            canDiscard={false}
          />
          <div
            style={{
              textAlign: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
              paddingTop: 20,
              marginBottom: 20,
            }}
          >
            <TableCenter
              wallCount={state.wall.length}
              turn={state.turn}
              scores={scores}
            />
          </div>
          <PlayerArea
            label="P0（あなた）"
            handTiles={handResults[0].baseHand}
            discards={state.discards[0]}
            tsumoTile={handResults[0].tsumoTile}
            direction="up"
            canDiscard={canDiscard}
            onClick={onDiscard}
          />
        </div>
      </div>
    </section>
  );
}
