import { useGame } from '../app/GameContext';
import { formatMoney } from '../game';
import { CAMPAIGN_RULES, VENUES } from '../content/gameContent';

/** Persistent campaign status and phase label. */
export function GameHeader(): React.JSX.Element {
  const { game } = useGame();
  if (!game) return <></>;
  const phaseLabel = game.phase === 'event' ? 'Rush decision' : game.phase;
  return (
    <header className="game-header">
      <div>
        <p className="eyebrow">Laneway Tycoon</p>
        <h1>
          Day {game.day}
          {game.mode === 'campaign' ? `/${CAMPAIGN_RULES.durationDays}` : ' · Endless'} ·{' '}
          {VENUES[game.venueId].shortName}
        </h1>
      </div>
      <dl className="status-strip" aria-label="Campaign status">
        <div>
          <dt>Cash</dt>
          <dd>{formatMoney(game.cashCents)}</dd>
        </div>
        <div>
          <dt>Reputation</dt>
          <dd>{game.reputation}/100</dd>
        </div>
        <div>
          <dt>Phase</dt>
          <dd className="capitalize">{phaseLabel}</dd>
        </div>
      </dl>
    </header>
  );
}
