import { useState } from 'react';

import ActionButton from '@/components/atoms/ActionButton';
import {
  type EvaluationSpeedMode,
  type EvaluationState,
  type PlayerId,
} from '@/hooks/useGame';

type LogPanelProps = {
  log: string[];
  evaluation: EvaluationState;
  onSetEvaluationTarget: (value: number) => void;
  onSetEvaluationSpeed: (mode: EvaluationSpeedMode) => void;
  onStartEvaluation: () => void;
};

export default function LogPanel({
  log,
  evaluation,
  onSetEvaluationTarget,
  onSetEvaluationSpeed,
  onStartEvaluation,
}: LogPanelProps) {
  const [showLog, setShowLog] = useState(true);
  const playerIds: PlayerId[] = [0, 1, 2, 3];
  const totalGames = evaluation.totalGames;
  const progressText = evaluation.isRunning
    ? `実行中: ${totalGames}/${evaluation.targetGames} セット`
    : `結果: ${totalGames}/${evaluation.targetGames} セット`;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section
        style={{
          border: '1px solid #eee',
          borderRadius: 16,
          padding: 14,
          background: 'white',
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
          <h2 style={{ margin: 0 }}>Log</h2>
          <ActionButton onClick={() => setShowLog((prev) => !prev)}>
            {showLog ? 'ログを非表示' : 'ログを表示'}
          </ActionButton>
        </div>
        {showLog ? (
          <div
            style={{
              maxHeight: 220,
              overflow: 'auto',
              border: '1px solid #f0f0f0',
              borderRadius: 12,
              padding: 10,
              background: '#fafafa',
              whiteSpace: 'pre-wrap',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 13,
            }}
          >
            {log.slice(-50).join('\n')}
          </div>
        ) : (
          <div style={{ color: '#777', fontSize: 13 }}>
            ログは非表示中です。
          </div>
        )}
      </section>

      <section
        style={{
          border: '1px solid #eee',
          borderRadius: 16,
          padding: 14,
          background: 'white',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0' }}>課題評価</h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#444', fontWeight: 600 }}>試行回数</span>
            <input
              type="number"
              min={1}
              value={evaluation.targetGames}
              disabled={evaluation.isRunning}
              onChange={(event) =>
                onSetEvaluationTarget(Number(event.target.value))
              }
              style={{
                width: 120,
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #ddd',
              }}
            />
          </label>
          <ActionButton
            onClick={onStartEvaluation}
            disabled={evaluation.isRunning}
          >
            連続実行
          </ActionButton>
          <span style={{ color: '#666', fontSize: 13 }}>
            現在の設定で評価します
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <span style={{ color: '#444', fontWeight: 600 }}>速度</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="radio"
              name="evaluation-speed"
              value="normal"
              checked={evaluation.speedMode === 'normal'}
              disabled={evaluation.isRunning}
              onChange={() => onSetEvaluationSpeed('normal')}
            />
            今まで通り
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="radio"
              name="evaluation-speed"
              value="fast-cpu"
              checked={evaluation.speedMode === 'fast-cpu'}
              disabled={evaluation.isRunning}
              onChange={() => onSetEvaluationSpeed('fast-cpu')}
            />
            CPU高速
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="radio"
              name="evaluation-speed"
              value="instant"
              checked={evaluation.speedMode === 'instant'}
              disabled={evaluation.isRunning}
              onChange={() => onSetEvaluationSpeed('instant')}
            />
            演出なし
          </label>
        </div>
        <div style={{ color: '#444', marginBottom: 10 }}>{progressText}</div>
        <div style={{ color: '#666', marginBottom: 12 }}>
          流局回数: {evaluation.draws}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
          }}
        >
          {playerIds.map((playerId) => {
            const ranks = evaluation.rankCounts[playerId];
            const firstRate =
              totalGames > 0 ? (ranks.first / totalGames) * 100 : 0;
            const secondRate =
              totalGames > 0 ? (ranks.second / totalGames) * 100 : 0;
            const thirdRate =
              totalGames > 0 ? (ranks.third / totalGames) * 100 : 0;
            const fourthRate =
              totalGames > 0 ? (ranks.fourth / totalGames) * 100 : 0;
            const avgFinalScore =
              totalGames > 0
                ? evaluation.totalFinalScores[playerId] / totalGames
                : 0;
            return (
              <div
                key={`eval-player-${playerId}`}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 10,
                  background: '#fafafa',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  P{playerId}
                </div>
                <div>1位率: {firstRate.toFixed(1)}%</div>
                <div>2位率: {secondRate.toFixed(1)}%</div>
                <div>3位率: {thirdRate.toFixed(1)}%</div>
                <div>4位率: {fourthRate.toFixed(1)}%</div>
                <div>平均最終点: {avgFinalScore.toFixed(1)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
