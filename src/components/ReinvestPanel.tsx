import {
  CART_IMPROVEMENT_COST_CENTS,
  EQUIPMENT,
  EQUIPMENT_IDS,
  VENUE_PROMOTIONS,
  VENUES,
  venueMeetsRequirement,
} from '../content/gameContent';
import { useGame } from '../app/GameContext';
import { formatMoney, type EquipmentId } from '../game';

/** Between-day equipment, venue promotion, legacy upgrade, and continuation controls. */
export function ReinvestPanel(): React.JSX.Element {
  const { command, game } = useGame();
  if (!game) return <></>;
  const hasSign = game.improvements.includes('street-sign');
  const promotion = game.venueId === 'departmentStore' ? null : VENUE_PROMOTIONS[game.venueId];
  const missingPromotionEquipment = promotion
    ? Object.entries(promotion.requiredEquipment).filter(
        ([id, level]) => game.equipment[id as EquipmentId] < level,
      )
    : [];
  const canPromote = Boolean(
    promotion &&
    game.cashCents >= promotion.costCents &&
    game.reputation >= promotion.reputationRequired &&
    missingPromotionEquipment.length === 0,
  );

  return (
    <section className="panel reinvest-panel" aria-labelledby="reinvest-title">
      <p className="eyebrow">After close</p>
      <h2 id="reinvest-title">Reinvest or call it a night</h2>
      <p>
        The till holds <strong>{formatMoney(game.cashCents)}</strong>. Stock carries into tomorrow;
        purchases in the next morning plan top it up.
      </p>
      <p className="field-help">
        Day {game.day} is settled once and saved under Game menu → Reports for later review.
      </p>

      <h3>Equipment workshop</h3>
      <div className="equipment-grid">
        {EQUIPMENT_IDS.map((equipmentId) => {
          const config = EQUIPMENT[equipmentId];
          const currentLevel = game.equipment[equipmentId];
          const currentTier = config.tiers.find((tier) => tier.level === currentLevel) ?? null;
          const nextTier = config.tiers.find((tier) => tier.level === currentLevel + 1);
          const venueReady = nextTier
            ? venueMeetsRequirement(game.venueId, nextTier.requiresVenue)
            : true;
          return (
            <article className={`equipment-card ${nextTier ? '' : 'is-owned'}`} key={equipmentId}>
              <div>
                <span className="level-badge">
                  Level {currentLevel}/{config.tiers.length}
                </span>
                <h4>{config.name}</h4>
                <p>{config.description}</p>
                <small>
                  {currentTier
                    ? `Current: ${currentTier.effect} · ${currentTier.reliabilityPercent}% reliability · ${formatMoney(currentTier.operatingCostCents)}/day maintenance`
                    : 'Current: owner setup'}
                </small>
                {nextTier ? (
                  <small>
                    Next: {nextTier.name} · {formatMoney(nextTier.costCents)} purchase · requires{' '}
                    {VENUES[nextTier.requiresVenue].shortName} · {nextTier.effect} ·{' '}
                    {nextTier.reliabilityPercent}% reliability ·{' '}
                    {formatMoney(nextTier.operatingCostCents)}/day maintenance
                  </small>
                ) : (
                  <small>Fully upgraded</small>
                )}
              </div>
              {nextTier ? (
                <button
                  className="button"
                  disabled={!venueReady || game.cashCents < nextTier.costCents}
                  onClick={() => command({ type: 'buyEquipment', equipmentId })}
                  type="button"
                >
                  {venueReady
                    ? `Buy ${config.name} level ${nextTier.level} · ${formatMoney(nextTier.costCents)}`
                    : `Requires ${VENUES[nextTier.requiresVenue].shortName}`}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      {promotion ? (
        <article className="promotion-card">
          <div>
            <p className="eyebrow">Next venue</p>
            <h3>Promote to {VENUES[promotion.to].shortName}</h3>
            <p>{VENUES[promotion.to].description}</p>
            <ul>
              <Requirement met={game.cashCents >= promotion.costCents}>
                {formatMoney(promotion.costCents)} available
              </Requirement>
              <Requirement met={game.reputation >= promotion.reputationRequired}>
                {promotion.reputationRequired} reputation
              </Requirement>
              {Object.entries(promotion.requiredEquipment).map(([id, level]) => (
                <Requirement key={id} met={game.equipment[id as EquipmentId] >= level}>
                  {EQUIPMENT[id as EquipmentId].name} level {level}
                </Requirement>
              ))}
            </ul>
          </div>
          <button
            className="button button-primary"
            disabled={!canPromote}
            onClick={() => command({ type: 'promoteVenue' })}
            type="button"
          >
            Promote to {VENUES[promotion.to].shortName}
          </button>
        </article>
      ) : (
        <article className="promotion-card is-owned">
          <h3>Flagship venue complete</h3>
          <p>
            The department-store coffee hall is open; commercial equipment and team depth now shape
            the flagship.
          </p>
        </article>
      )}

      <article className={`upgrade-card ${hasSign ? 'is-owned' : ''}`}>
        <div aria-hidden="true" className="upgrade-icon">
          ↗
        </div>
        <div>
          <h3>Hand-painted street sign</h3>
          <p>A little more passing trade and a slightly smoother service path.</p>
          <strong>{hasSign ? 'Owned' : formatMoney(CART_IMPROVEMENT_COST_CENTS)}</strong>
        </div>
        {!hasSign ? (
          <button
            className="button"
            disabled={game.cashCents < CART_IMPROVEMENT_COST_CENTS}
            onClick={() => command({ type: 'buyImprovement', improvementId: 'street-sign' })}
            type="button"
          >
            Buy sign
          </button>
        ) : null}
      </article>
      <button
        className="button button-primary"
        onClick={() => command({ type: 'startNextDay' })}
        type="button"
      >
        Plan Day {game.day + 1}
      </button>
    </section>
  );
}

function Requirement({
  children,
  met,
}: {
  children: React.ReactNode;
  met: boolean;
}): React.JSX.Element {
  return (
    <li className={met ? 'met' : ''}>
      <span aria-hidden="true">{met ? '✓' : '○'}</span>{' '}
      <span className="sr-only">{met ? 'Ready: ' : 'Still needed: '}</span>
      {children}
    </li>
  );
}
