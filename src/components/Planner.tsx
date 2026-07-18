import { useState } from 'react';

import {
  BEAN_DETAILS,
  DRINKS,
  PURCHASE_PACKAGES,
  VENUES,
  VENUE_MENU_CAPACITY,
  WEATHER_DETAILS,
} from '../content/gameContent';
import { useGame } from '../app/GameContext';
import { canOpen, formatMoney, selectedSupplyCost, type DialIn, type DrinkId } from '../game';
import { TeamPlanner } from './TeamPlanner';

const DIAL_OPTIONS: Array<{ id: DialIn; label: string; detail: string }> = [
  { id: 'speed', label: 'Speed', detail: 'Quicker cups, less finesse' },
  { id: 'balanced', label: 'Balanced', detail: 'A dependable middle path' },
  { id: 'quality', label: 'Quality', detail: 'Slower, more satisfying coffee' },
];

/** Morning menu, pricing, supply, and espresso dial-in controls. */
export function Planner(): React.JSX.Element {
  const { command, game } = useGame();
  const [activeSection, setActiveSection] = useState<'menu' | 'supplies' | 'dial' | 'team'>('menu');
  if (!game) return <></>;
  const supplyCost = selectedSupplyCost(game);
  const weather = WEATHER_DETAILS[game.weather];

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
          <h2 id="planner-title">Set up the {game.venueId}</h2>
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
            onClick={() => setActiveSection(id)}
            role="tab"
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
                <label className="price-field">
                  Price
                  <span>
                    $
                    <input
                      aria-label={`${drink.name} price in dollars`}
                      disabled={!checked}
                      inputMode="decimal"
                      max="12"
                      min="2.5"
                      onChange={(event) => {
                        const dollars = Number(event.target.value);
                        if (Number.isFinite(dollars)) {
                          command({
                            type: 'prepareDay',
                            patch: { pricesCents: { [drink.id]: Math.round(dollars * 100) } },
                          });
                        }
                      }}
                      step="0.1"
                      type="number"
                      value={(game.plan.pricesCents[drink.id] / 100).toFixed(2)}
                    />
                  </span>
                </label>
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
          {PURCHASE_PACKAGES.map((item) => (
            <label className="supply-row" key={item.ingredientId}>
              <span>
                <strong>{item.label}</strong>
                <small>{formatMoney(item.costCents)} per pack</small>
              </span>
              <input
                aria-label={`${item.label} package quantity`}
                inputMode="numeric"
                max={20}
                min={0}
                onChange={(event) => {
                  const quantity = Number(event.target.value);
                  if (Number.isInteger(quantity)) {
                    command({
                      type: 'prepareDay',
                      patch: { purchases: { [item.ingredientId]: quantity } },
                    });
                  }
                }}
                type="number"
                value={game.plan.purchases[item.ingredientId]}
              />
            </label>
          ))}
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
            {VENUES[game.venueId].shortName} supports {VENUES[game.venueId].staffCapacity} scheduled
            staff and {VENUES[game.venueId].menuCapacity} menu items.
          </li>
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
          Open the {game.venueId}
        </button>
      </div>
    </section>
  );
}
