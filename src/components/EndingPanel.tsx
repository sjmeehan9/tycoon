import { CAMPAIGN_RULES, VENUES } from '../content/gameContent';
import { useGame } from '../app/GameContext';
import { formatMoney } from '../game';

/** Campaign victory, bankruptcy, and target-missed actions. */
export function EndingPanel(): React.JSX.Element {
  const { command, game, meta, startCampaign } = useGame();
  const outcome = game?.outcome;
  if (!game || !outcome) return <></>;
  const won = outcome.type === 'victory';
  return (
    <section
      className={`panel ending-panel ${won ? 'is-victory' : 'is-defeat'}`}
      aria-labelledby="ending-title"
    >
      <p className="eyebrow">{won ? 'Campaign complete' : 'Campaign closed'}</p>
      <h2 id="ending-title">{outcome.title}</h2>
      <p>{outcome.message}</p>
      <dl className="ending-stats">
        <div>
          <dt>Venue</dt>
          <dd>{VENUES[game.venueId].shortName}</dd>
        </div>
        <div>
          <dt>Cash</dt>
          <dd>{formatMoney(game.cashCents)}</dd>
        </div>
        <div>
          <dt>Reputation</dt>
          <dd>{game.reputation}/100</dd>
        </div>
        <div>
          <dt>Day</dt>
          <dd>{game.day}</dd>
        </div>
      </dl>
      {won ? (
        <div className="unlock-card">
          <strong>
            Unlocked: endless mode, Rainy Season, Wattle Awning, Mosaic Floor, and Brass Bay Plaques
          </strong>
          <span>
            Achievements and scenarios change presentation and records only; every new campaign
            starts with the same economy.
          </span>
          {meta.achievements.includes('threeBayConductor') ? (
            <span>Every station and lane served on Day 40: After-hours Glow unlocked.</span>
          ) : (
            <span>
              Serve every station and both lanes on a winning Day 40 to unlock After-hours Glow.
            </span>
          )}
        </div>
      ) : outcome.type === 'targetMissed' ? (
        <p>
          Target: department-store coffee hall · {formatMoney(CAMPAIGN_RULES.victoryCashCents)} ·{' '}
          {CAMPAIGN_RULES.victoryReputation} reputation.
        </p>
      ) : null}
      <div className="ending-actions">
        {won && meta.endlessUnlocked ? (
          <button
            className="button button-primary"
            onClick={() => command({ type: 'continueEndless' })}
            type="button"
          >
            Continue in endless mode
          </button>
        ) : null}
        <button
          className="button"
          onClick={() => startCampaign(game.seed, game.scenarioId)}
          type="button"
        >
          Start fresh campaign
        </button>
      </div>
    </section>
  );
}
