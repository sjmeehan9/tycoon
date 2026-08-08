import { useState } from 'react';

import { handleTabListKeyDown } from '../accessibility/keyboard';
import {
  BEAN_DETAILS,
  DAY_PLAN_LIMITS,
  DRINKS,
  PURCHASE_PACKAGES,
  VENUES,
  VENUE_MENU_CAPACITY,
  WEATHER_DETAILS,
  workforceCapacityFor,
} from '../content/gameContent';
import { useGame } from '../app/GameContext';
import {
  canOpen,
  formatIngredientQuantity,
  formatMoney,
  ingredientCapacities,
  selectedSupplyCost,
  type DialIn,
  type DrinkId,
} from '../game';
import { TeamPlanner } from './TeamPlanner';
import { AccessibleStepper } from './AccessibleStepper';

const DIAL_OPTIONS: Array<{ id: DialIn; label: string; detail: string }> = [
  { id: 'speed', label: 'Speed', detail: 'Quicker cups, less finesse' },
  { id: 'balanced', label: 'Balanced', detail: 'A dependable middle path' },
  { id: 'quality', label: 'Quality', detail: 'Slower, more satisfying coffee' },
];

/** Morning menu, pricing, supply, and espresso dial-in controls. */
export function Planner(): React.JSX.Element {
  const { command, game, preferences, updatePreferences } = useGame();
  const [activeSection, setActiveSection] = useState<'menu' | 'supplies' | 'dial' | 'team'>(() =>
    isPlannerSection(preferences.activeTab) ? preferences.activeTab : 'menu',
  );
  if (!game) return <></>;
  const supplyCost = selectedSupplyCost(game);
  const weather = WEATHER_DETAILS[game.weather];
  const capacityByIngredient = new Map(
    ingredientCapacities(game).map((capacity) => [capacity.ingredientId, capacity] as const),
  );

  const toggleDrink = (drinkId: DrinkId): void => {
    const active = game.plan.activeMenu.includes(drinkId);
    const activeMenu = active
      ? game.plan.activeMenu.filter((id) => id !== drinkId)
      : [...game.plan.activeMenu, drinkId];
    command({ type: 'prepareDay', patch: { activeMenu } });
  };

  return (
    <section className="panel planner" aria-labelledby="planner-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Morning planning</p>
          <h2 id="planner-title" tabIndex={-1}>
            Set up the {VENUES[game.venueId].actionName}
          </h2>
        </div>
        <p className="forecast-badge">
          {weather.name} · {weather.note}
        </p>
      </div>

      <div aria-label="Morning planning sections" className="mobile-tabs" role="tablist">
        {(
          [
            ['menu', 'Menu'],
            ['supplies', 'Supplies'],
            ['dial', 'Dial-in'],
            ['team', 'Team'],
          ] as const
        ).map(([id, label]) => (
          <button
            aria-controls={`planner-${id}`}
            aria-selected={activeSection === id}
            id={`planner-${id}-tab`}
            key={id}
            onClick={() => {
              setActiveSection(id);
              updatePreferences({ activeTab: id });
            }}
            onKeyDown={handleTabListKeyDown}
            role="tab"
            tabIndex={activeSection === id ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <fieldset
        aria-labelledby="planner-menu-tab"
        className={`planner-section ${activeSection === 'menu' ? 'mobile-active' : ''}`}
        id="planner-menu"
        role="tabpanel"
      >
        <legend>Menu and prices · choose up to {VENUE_MENU_CAPACITY[game.venueId]}</legend>
        <div className="menu-grid">
          {DRINKS.map((drink) => {
            const checked = game.plan.activeMenu.includes(drink.id);
            return (
              <div className={`menu-card ${checked ? 'is-selected' : ''}`} key={drink.id}>
                <label className="check-row">
                  <input checked={checked} onChange={() => toggleDrink(drink.id)} type="checkbox" />
                  <span>
                    <strong>{drink.name}</strong>
                    <small>{drink.description}</small>
                    <small className="recipe-note">
                      {drink.variants.map((variant) => variant.size).join(' / ')} ·{' '}
                      {drink.allowedMilks.join(' / ')}
                    </small>
                  </span>
                </label>
                <div className="price-field">
                  <span>Price</span>
                  <AccessibleStepper
                    decrementDisabled={
                      !checked ||
                      game.plan.pricesCents[drink.id] <= DAY_PLAN_LIMITS.priceCents.minimum
                    }
                    decrementLabel={`Decrease ${drink.name} price by ${formatMoney(DAY_PLAN_LIMITS.priceCents.increment)}`}
                    incrementDisabled={
                      !checked ||
                      game.plan.pricesCents[drink.id] >= DAY_PLAN_LIMITS.priceCents.maximum
                    }
                    incrementLabel={`Increase ${drink.name} price by ${formatMoney(DAY_PLAN_LIMITS.priceCents.increment)}`}
                    label={`${drink.name} price`}
                    onDecrement={() =>
                      command({ type: 'adjustPlanPrice', drinkId: drink.id, direction: -1 })
                    }
                    onIncrement={() =>
                      command({ type: 'adjustPlanPrice', drinkId: drink.id, direction: 1 })
                    }
                    value={formatMoney(game.plan.pricesCents[drink.id])}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <section
        aria-labelledby="planner-team-tab"
        className={`planner-section ${activeSection === 'team' ? 'mobile-active' : ''}`}
        id="planner-team"
        role="tabpanel"
      >
        <h3>Hire and schedule</h3>
        <TeamPlanner />
      </section>

      <fieldset
        aria-labelledby="planner-supplies-tab"
        className={`planner-section ${activeSection === 'supplies' ? 'mobile-active' : ''}`}
        id="planner-supplies"
        role="tabpanel"
      >
        <legend>Supply order</legend>
        <div className="supply-list">
          {PURCHASE_PACKAGES.map((item) => {
            const quantity = game.plan.purchases[item.ingredientId];
            const capacity = capacityByIngredient.get(item.ingredientId);
            return (
              <div className="supply-row" key={item.ingredientId}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{formatMoney(item.costCents)} per pack</small>
                </span>
                <AccessibleStepper
                  decrementDisabled={quantity <= DAY_PLAN_LIMITS.packageQuantity.minimum}
                  decrementLabel={`Decrease ${item.label} package quantity by 1 package`}
                  incrementDisabled={quantity >= DAY_PLAN_LIMITS.packageQuantity.maximum}
                  incrementLabel={`Increase ${item.label} package quantity by 1 package`}
                  label={`${item.label} package quantity`}
                  onDecrement={() =>
                    command({
                      type: 'adjustPlanPurchase',
                      ingredientId: item.ingredientId,
                      direction: -1,
                    })
                  }
                  onIncrement={() =>
                    command({
                      type: 'adjustPlanPurchase',
                      ingredientId: item.ingredientId,
                      direction: 1,
                    })
                  }
                  value={String(quantity)}
                />
                {capacity ? (
                  <output
                    aria-atomic="true"
                    aria-label={`${capacity.name} usable stock and weighted serves after selected purchase`}
                    aria-live="polite"
                    className="supply-capacity"
                  >
                    <span>
                      <strong>
                        {formatIngredientQuantity(capacity.usableQuantity, capacity.unit)} usable
                        after order
                      </strong>
                      <small>
                        {formatIngredientQuantity(capacity.carriedQuantity, capacity.unit)} carried
                        {capacity.pendingPurchaseQuantity > 0
                          ? ` + ${formatIngredientQuantity(capacity.pendingPurchaseQuantity, capacity.unit)} pending`
                          : ' · no pending purchase'}
                      </small>
                    </span>
                    <span className="capacity-estimate">
                      {capacity.isUsedToday
                        ? `~${String(capacity.estimatedServes)} serves${capacity.isLimiting ? ' · limiting stock' : ''}`
                        : 'Not used today'}
                    </span>
                    <small className="capacity-expiry">
                      {capacity.earliestExpiry
                        ? `${formatIngredientQuantity(capacity.earliestExpiry.quantity, capacity.unit)} expires after Day ${String(capacity.earliestExpiry.day)} rush`
                        : 'No stock awaiting expiry'}
                    </small>
                  </output>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset
        aria-labelledby="planner-dial-tab"
        className={`planner-section ${activeSection === 'dial' ? 'mobile-active' : ''}`}
        id="planner-dial"
        role="tabpanel"
      >
        <legend>Espresso dial-in</legend>
        <label className="bean-select">
          Beans for espresso and filter
          <select
            onChange={(event) =>
              command({
                type: 'prepareDay',
                patch: { beanId: event.target.value as keyof typeof BEAN_DETAILS },
              })
            }
            value={game.plan.beanId}
          >
            {Object.entries(BEAN_DETAILS).map(([id, detail]) => (
              <option key={id} value={id}>
                {detail.name} — {detail.description}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented-options">
          {DIAL_OPTIONS.map((option) => (
            <label className={game.plan.dialIn === option.id ? 'is-selected' : ''} key={option.id}>
              <input
                checked={game.plan.dialIn === option.id}
                name="dial-in"
                onChange={() => command({ type: 'prepareDay', patch: { dialIn: option.id } })}
                type="radio"
              />
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <aside className="demand-forecast" aria-labelledby="forecast-title">
        <strong id="forecast-title">Demand clues</strong>
        <ul>
          <li>{weather.note}</li>
          <li>Higher prices reduce arrivals, especially price-sensitive students.</li>
          <li>Reputation {game.reputation}/100 currently supports passing demand.</li>
          <li>{BEAN_DETAILS[game.plan.beanId].description}</li>
          <li>
            {VENUES[game.venueId].shortName} supports{' '}
            {workforceCapacityFor(game.venueId).scheduleCapacity} scheduled staff from a{' '}
            {workforceCapacityFor(game.venueId).rosterCapacity}-person roster and{' '}
            {VENUES[game.venueId].menuCapacity} menu items.
          </li>
          {game.venueId === 'departmentStore' ? (
            <li>
              Managers reduce coordination and reliability delay; Runners reduce replenishment and
              handoff delay without creating stock.
            </li>
          ) : null}
          <li>Visible queues and unavailable recipes turn customers away.</li>
        </ul>
      </aside>

      <div className="planner-total">
        <div>
          <span>Supply order</span>
          <strong>{formatMoney(supplyCost)}</strong>
          <small>{formatMoney(game.cashCents - supplyCost)} cash after buying supplies</small>
        </div>
        <button
          className="button button-primary"
          disabled={!canOpen(game)}
          onClick={() => command({ type: 'startRush' })}
          type="button"
        >
          Open the {VENUES[game.venueId].actionName}
        </button>
      </div>
    </section>
  );
}

function isPlannerSection(value: string): value is 'menu' | 'supplies' | 'dial' | 'team' {
  return ['menu', 'supplies', 'dial', 'team'].includes(value);
}
