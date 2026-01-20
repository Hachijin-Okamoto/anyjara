import GameControls from '@/components/organisms/GameControls';
import LogPanel from '@/components/organisms/LogPanel';
import RulesPanel from '@/components/organisms/RulesPanel';
import TableBoard from '@/components/organisms/TableBoard';
import GameSectionGrid from '@/components/templates/GameSectionGrid';
import { HUMAN, RULE, useGame } from '@/hooks/useGame';

export default function App() {
  const {
    state,
    statusText,
    evaluation,
    winTarget,
    canStart,
    canDiscard,
    startGame,
    discard,
  } = useGame();

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ margin: 0 }}>Donjara (Minimal) - 4 Players</h1>
      <p style={{ marginTop: 8, color: '#555' }}>{statusText}</p>

      <GameControls
        canStart={canStart}
        wallCount={state.wall.length}
        onStart={startGame}
      />

      <GameSectionGrid>
        <TableBoard
          state={state}
          humanId={HUMAN}
          canDiscard={canDiscard}
          onDiscard={discard}
          evaluation={evaluation}
          winTarget={winTarget}
        />
        <RulesPanel rule={RULE} evaluation={evaluation} />
        <LogPanel log={state.log} />
      </GameSectionGrid>

      <footer style={{ marginTop: 16, color: '#666', fontSize: 13 }}>
        設定は rule.json で変更できます。
      </footer>
    </div>
  );
}
