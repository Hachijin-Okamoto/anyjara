import { useState } from 'react';

import ActionButton from '@/components/atoms/ActionButton';
import TileButton from '@/components/atoms/TileButton';
import PlayerArea from '@/components/molecules/PlayerArea';
import TableCenter from '@/components/molecules/TableCenter';
import { type GameState, type PlayerId } from '@/hooks/useGame';

type TableBoardProps = {
  state: GameState;
  humanId: PlayerId;
  canDiscard: boolean;
  canReach: boolean;
  allowedDiscardIds: Set<string> | null;
  onReach: () => void;
  onDiscard: (tileId: string) => void;
  onNextHand: () => void;
};

export default function TableBoard({
  state,
  canDiscard,
  canReach,
  allowedDiscardIds,
  onReach,
  onDiscard,
  onNextHand,
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

  const scores = state.score;
  const winInfo = state.winInfo;
  const drawInfo = state.drawInfo;
  const showResult = winInfo || drawInfo;
  const reachPlayer = state.lastReach;
  const hasReach = reachPlayer !== null;

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
        {hasReach && (
          <div
            style={{
              position: 'absolute',
              insetInline: 0,
              top: 24,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                padding: '10px 26px',
                borderRadius: 999,
                background:
                  'linear-gradient(90deg, rgba(220,40,40,0.9), rgba(255,140,50,0.9))',
                color: 'white',
                fontWeight: 800,
                letterSpacing: 1.5,
                boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
                transform: 'skewX(-8deg)',
              }}
            >
              P{reachPlayer} リーチ
            </div>
          </div>
        )}
        {showResult && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.78)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: 'min(92vw, 900px)',
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid #ddd',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
              }}
            >
              {winInfo ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 700 }}>
                        P{winInfo.playerId} 勝利
                      </span>
                      <span style={{ color: '#666' }}>
                        {winInfo.winType === 'ron' ? 'ロン' : 'ツモ'}
                      </span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      得点 {winInfo.points}
                    </div>
                  </div>
                  <div style={{ marginBottom: 12, color: '#444' }}>
                    役:{' '}
                    {winInfo.yakuNames.length > 0
                      ? winInfo.yakuNames.join(' / ')
                      : 'なし'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      padding: 12,
                      borderRadius: 12,
                      background: '#f7f7f7',
                      border: '1px solid #eee',
                    }}
                  >
                    {winInfo.hand.map((tile) => (
                      <TileButton key={tile.id} tile={tile} disabled scale={0.9} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 700 }}>流局</span>
                    <span style={{ color: '#666' }}>上がりなし</span>
                  </div>
                  <div style={{ marginBottom: 12, color: '#444' }}>
                    {state.setOver ? '親が2周したためセット終了。' : '次ゲームへ。'}
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <ActionButton onClick={onNextHand}>OK</ActionButton>
              </div>
            </div>
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, top: 140 }}>
          <PlayerArea
            label="P1"
            handTiles={handResults[1].baseHand}
            discards={state.discards[1]}
            tsumoTile={handResults[1].tsumoTile}
            direction="right"
            showHandFaces={showOpponentHands}
            canDiscard={false}
            reachDiscardId={state.reachDiscardIds[1]}
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
            reachDiscardId={state.reachDiscardIds[3]}
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
            reachDiscardId={state.reachDiscardIds[2]}
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
              dealer={state.dealer}
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
            allowedDiscardIds={allowedDiscardIds}
            reachDiscardId={state.reachDiscardIds[0]}
            onClick={onDiscard}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              marginTop: 10,
            }}
          >
            <ActionButton onClick={onReach} disabled={!canReach}>
              リーチ
            </ActionButton>
          </div>
        </div>
      </div>
    </section>
  );
}
