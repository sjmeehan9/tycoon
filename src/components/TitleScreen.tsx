import { useState } from 'react';

import { useGame } from '../app/GameContext';
import { SCENARIO_DETAILS } from '../content/gameContent';
import type { ScenarioId } from '../game';

/** New/continue campaign entry screen. */
export function TitleScreen(): React.JSX.Element {
  const { continueCampaign, hasSave, meta, resetCampaign, startCampaign } = useGame();
  const [seed, setSeed] = useState(2607);
  const [scenarioId, setScenarioId] = useState<ScenarioId>('lanewayClassic');

  return (
    <main className="title-screen">
      <section className="title-card" aria-labelledby="game-title">
        <div className="pixel-cup" aria-hidden="true">
          ☕
        </div>
        <p className="eyebrow">A tiny Melbourne coffee empire</p>
        <h1 id="game-title">Laneway Tycoon</h1>
        <p className="title-copy">
          Price the flat whites, mind the milk, tame the queue, and turn one brave cart into the
          cafe locals swear they discovered first.
        </p>
        <label className="seed-field">
          Campaign seed
          <input
            aria-describedby="seed-help"
            inputMode="numeric"
            max={4_294_967_295}
            min={0}
            onChange={(event) => setSeed(Number(event.target.value))}
            type="number"
            value={seed}
          />
        </label>
        <p className="field-help" id="seed-help">
          The same seed and decisions produce the same customers and outcomes.
        </p>
        <label className="seed-field">
          Scenario
          <select
            onChange={(event) => setScenarioId(event.target.value as ScenarioId)}
            value={scenarioId}
          >
            {meta.scenarios.map((id) => (
              <option key={id} value={id}>
                {SCENARIO_DETAILS[id].name} — {SCENARIO_DETAILS[id].description}
              </option>
            ))}
          </select>
        </label>
        <div className="title-actions">
          <button
            className="button button-primary"
            onClick={() => startCampaign(seed, scenarioId)}
            type="button"
          >
            Start new campaign
          </button>
          {hasSave ? (
            <button className="button" onClick={continueCampaign} type="button">
              Continue autosave
            </button>
          ) : null}
        </div>
        {hasSave ? (
          <button className="text-button" onClick={resetCampaign} type="button">
            Clear local campaign
          </button>
        ) : null}
      </section>
    </main>
  );
}
