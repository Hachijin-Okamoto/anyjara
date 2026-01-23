import GameControls from '@/components/organisms/GameControls';
import LogPanel from '@/components/organisms/LogPanel';
import RulesPanel from '@/components/organisms/RulesPanel';
import TableBoard from '@/components/organisms/TableBoard';
import GameSectionGrid from '@/components/templates/GameSectionGrid';
import { HUMAN, useGame } from '@/hooks/useGame';

export default function App() {
  const {
    state,
    statusText,
    currentRule,
    canStart,
    canDiscard,
    canReach,
    declareReach,
    allowedDiscardIds,
    rules,
    currentRuleIndex,
    setCurrentRuleIndex,
    startGame,
    discard,
    aiStrategies,
    playerStrategyIds,
    setPlayerStrategyIds,
    evaluation,
    setEvaluationTarget,
    startEvaluation,
  } = useGame();

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ margin: 0 }}>Anyjara - 4 Players</h1>
      <p style={{ marginTop: 8, color: '#555' }}>{statusText}</p>

      <GameControls
        canStart={canStart}
        wallCount={state.wall.length}
        onStart={startGame}
        rules={rules}
        selectedRuleIndex={currentRuleIndex}
        onSelectRule={setCurrentRuleIndex}
        aiStrategies={aiStrategies}
        playerStrategyIds={playerStrategyIds}
        onSelectPlayerStrategy={(playerId, strategyId) =>
          setPlayerStrategyIds((prev) => ({ ...prev, [playerId]: strategyId }))
        }
      />

      <GameSectionGrid>
        <TableBoard
          state={state}
          humanId={HUMAN}
          canDiscard={canDiscard}
          canReach={canReach}
          allowedDiscardIds={allowedDiscardIds}
          onReach={declareReach}
          onDiscard={discard}
          onNextHand={startGame}
        />
        <RulesPanel rule={currentRule} />
        <LogPanel
          log={state.log}
          evaluation={evaluation}
          onSetEvaluationTarget={setEvaluationTarget}
          onStartEvaluation={startEvaluation}
        />
      </GameSectionGrid>

      <footer style={{ marginTop: 16, color: '#666', fontSize: 13 }}>
        設定は rule.json で変更できます。
      </footer>
    </div>
  );
}
