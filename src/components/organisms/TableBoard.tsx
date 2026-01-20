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
  evaluation,
  winTarget,
}: TableBoardProps) {
  const lastDrawnId = state.lastDrawn[humanId];
  const hand = state.hands[humanId];
  const drawnTile = lastDrawnId
    ? hand.find((t) => t.id === lastDrawnId)
    : undefined;
  const baseHand = drawnTile ? hand.filter((t) => t.id !== lastDrawnId) : hand;

  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 16,
        padding: 14,
        background: 'white',
      }}
    >
      <h2 style={{ margin: '0 0 10px 0' }}>Table</h2>

      <div
        style={{
          position: 'relative',
          height: 520,
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
          label={`P2 手札: ${state.hands[2].length} 枚`}
          discards={state.discards[2]}
          maxTiles={8}
          direction="row"
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />

        <PlayerArea
          label={`P3 手札: ${state.hands[3].length} 枚`}
          discards={state.discards[3]}
          maxTiles={6}
          direction="column"
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />

        <PlayerArea
          label={`P1 手札: ${state.hands[1].length} 枚`}
          discards={state.discards[1]}
          maxTiles={6}
          direction="column"
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <PlayerArea
            label={`P0 捨て牌: ${state.discards[humanId].length} 枚`}
            discards={state.discards[humanId]}
            maxTiles={8}
            direction="row"
            style={{ marginBottom: 10 }}
          />
          <div style={{ color: '#555', textAlign: 'center', marginBottom: 6 }}>
            P0（あなた）
          </div>
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
            >
              {baseHand.map((t) => (
                <TileButton
                  key={t.id}
                  tile={t}
                  disabled={!canDiscard}
                  onClick={() => onDiscard(t.id)}
                />
              ))}
            </div>
            {drawnTile ? (
              <div style={{ marginLeft: 12, boxShadow: '0 0 8px #888' }}>
                <TileButton
                  tile={drawnTile}
                  disabled={!canDiscard}
                  onClick={() => onDiscard(drawnTile.id)}
                />
              </div>
            ) : null}
          </div>
          <div style={{ marginTop: 8, textAlign: 'center', color: '#555' }}>
            揃い数: <b>{evaluation.totalSets}</b> / 現在得点:{' '}
            <b>{evaluation.points}</b> / 目標 {winTarget}
          </div>
        </div>

        <TableCenter wallCount={state.wall.length} turn={state.turn} />
      </div>
    </section>
  );
}
