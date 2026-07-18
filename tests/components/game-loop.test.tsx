import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import {
  advanceTick,
  closeDay,
  createCampaign,
  resolveEvent,
  startRush,
  type GameState,
} from '../../src/game';
import {
  SAVE_KEY,
  BrowserSaveStore,
  createSaveEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import { nearBankruptcyEnvelope, nearVictoryEnvelope } from '../fixtures/campaignFixtures';

function renderGame(): void {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}

function stateAtEvent(): GameState {
  let state = startRush(createCampaign({ seed: 222 }));
  while (state.phase === 'rush') state = advanceTick(state);
  return state;
}

function stateAtReport(): GameState {
  let state = stateAtEvent();
  state = resolveEvent(state, 'protect-queue');
  while (state.phase === 'rush') state = advanceTick(state);
  return state;
}

describe('playable cart UI', () => {
  it('starts a campaign and enforces planning constraints', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    expect(await screen.findByRole('heading', { name: 'Set up the cart' })).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: /Long Black/ }));
    await user.click(screen.getByRole('checkbox', { name: /Flat White/ }));
    expect(await screen.findByText('Choose between 1 and 3 cart drinks.')).toBeVisible();
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(1);
  });

  it('opens service and exposes pause and speed controls', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(await screen.findByRole('button', { name: 'Open the cart' }));
    expect(screen.getByRole('heading', { name: 'The laneway is moving' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '4×' }));
    expect(screen.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('provides touch-sized mobile planning tabs without hiding actions from the DOM', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    const supplies = await screen.findByRole('tab', { name: 'Supplies' });
    expect(supplies).toHaveAttribute('aria-selected', 'false');
    await user.click(supplies);
    expect(supplies).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Supplies' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open the cart' })).toBeEnabled();
  });

  it('exposes the complete menu, modifiers, beans, and demand explanations', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    expect(await screen.findByText('Cold Brew')).toBeVisible();
    expect(screen.getAllByText(/regular \/ large · dairy \/ oat \/ soy/i)[0]).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Beans for espresso and filter' })).toHaveValue(
      'houseBeans',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Beans for espresso and filter' }),
      'singleOriginBeans',
    );
    expect(screen.getByText(/Higher prices reduce arrivals/)).toBeVisible();
    expect(screen.getByText(/Visible queues and unavailable recipes/)).toBeVisible();
  });

  it('renders and resolves the seeded event dialog', async () => {
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(stateAtEvent()));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    expect(await screen.findByRole('dialog', { name: /office coffee run/i })).toHaveTextContent(
      'office coffee run',
    );
    await user.click(screen.getByRole('button', { name: /Protect the queue/ }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /office coffee run/i })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: 'The laneway is moving' })).toBeVisible();
  });

  it('shows report semantics and allows settlement and reinvestment', async () => {
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(stateAtReport()));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    expect(await screen.findByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    expect(screen.getByRole('table', { name: 'Cash reconciliation' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Actual charges' })).toBeVisible();
    expect(screen.getByRole('list', { name: 'Recent actual sale charges' })).toBeVisible();
    expect(screen.getByText(/matching sales revenue/i)).toBeVisible();
    expect(screen.getByText('Bottleneck')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Settle the day' }));
    expect(
      await screen.findByRole('heading', { name: 'Reinvest or call it a night' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Plan Day 2' })).toBeEnabled();
  });

  it('hires both roles and schedules a daily team with visible payroll', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(await screen.findByRole('tab', { name: 'Team' }));
    await user.click(screen.getAllByRole('button', { name: /^Hire / })[0]!);
    await user.click(screen.getAllByRole('button', { name: /^Hire / })[0]!);
    const barista = screen.getByRole('checkbox', { name: /Barista · speed/ });
    const frontOfHouse = screen.getByRole('checkbox', { name: /Front of house · speed/ });
    await user.click(barista);
    await user.click(frontOfHouse);
    expect(barista).toBeChecked();
    expect(frontOfHouse).toBeChecked();
    expect(screen.getByText(/2\/2 scheduled/)).toBeVisible();
    expect(screen.getByText(/payroll at close/)).toBeVisible();
  });

  it('buys equipment and promotes the same venue through kiosk to cafe', async () => {
    const reinvest = {
      ...closeDay(stateAtReport()),
      cashCents: 100_000,
      reputation: 60,
    };
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(reinvest));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const firstPromotion = screen.getByRole('button', { name: 'Promote to Coffee Kiosk' });
    expect(firstPromotion).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Buy Grinder level 1/ }));
    await user.click(screen.getByRole('button', { name: /Buy Espresso machine level 1/ }));
    expect(firstPromotion).toBeEnabled();
    await user.click(firstPromotion);
    expect(screen.getByRole('heading', { name: /Day 1\/30 · Coffee Kiosk/ })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Buy Grinder level 2/ }));
    await user.click(screen.getByRole('button', { name: /Buy Espresso machine level 2/ }));
    await user.click(screen.getByRole('button', { name: /Buy Refrigeration level 1/ }));
    await user.click(screen.getByRole('button', { name: /Buy Point of sale level 1/ }));
    const cafePromotion = screen.getByRole('button', { name: 'Promote to Specialty Cafe' });
    expect(cafePromotion).toBeEnabled();
    await user.click(cafePromotion);
    expect(screen.getByRole('heading', { name: /Day 1\/30 · Specialty Cafe/ })).toBeVisible();
    expect(screen.getByText('Laneway Specialty Cafe')).toBeVisible();
  });

  it('imports a validated near-victory file, unlocks meta, and enters endless mode', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Save transfer' }));
    await user.upload(
      screen.getByLabelText('Import save JSON file'),
      new File([serializeEnvelope(nearVictoryEnvelope())], 'near-victory.json', {
        type: 'application/json',
      }),
    );
    expect(await screen.findByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Settle the day' }));
    expect(await screen.findByRole('heading', { name: /local institution/ })).toBeVisible();
    expect(screen.getByText(/Unlocked: endless mode/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Continue in endless mode' }));
    expect(
      screen.getByRole('heading', { name: /Day 31 · Endless · Specialty Cafe/ }),
    ).toBeVisible();
  });

  it('imports a near-floor state and presents bankruptcy restart actions', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Save transfer' }));
    await user.upload(
      screen.getByLabelText('Import save JSON file'),
      new File([serializeEnvelope(nearBankruptcyEnvelope())], 'near-bankruptcy.json', {
        type: 'application/json',
      }),
    );
    await user.click(await screen.findByRole('button', { name: 'Settle the day' }));
    expect(await screen.findByRole('heading', { name: /till can’t stretch/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Start fresh campaign' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Continue in endless mode' }),
    ).not.toBeInTheDocument();
  });

  it('rejects an incompatible import without disrupting the active run', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Save transfer' }));
    await user.upload(
      screen.getByLabelText('Import save JSON file'),
      new File(['{"schemaVersion":99}'], 'future.json', { type: 'application/json' }),
    );
    expect(await screen.findByText('Import rejected; current data is unchanged.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close game menu' }));
    expect(screen.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
  });

  it('restores a last-known-good backup through the recovery UI', async () => {
    const store = new BrowserSaveStore(window.localStorage);
    const first = createSaveEnvelope(createCampaign({ seed: 100 }));
    store.save(first);
    store.save(createSaveEnvelope(createCampaign({ seed: 101 })));
    window.localStorage.setItem(SAVE_KEY, '{broken');
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Save transfer' }));
    await user.click(screen.getByRole('button', { name: 'Restore last-known-good save' }));
    expect(await screen.findByRole('heading', { name: /Day 1\/30 · Coffee Cart/ })).toBeVisible();
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(serializeEnvelope(first));
  });
});
