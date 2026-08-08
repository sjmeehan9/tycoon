import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import {
  advanceTick,
  closeDay,
  createCampaign,
  formatMoney,
  resolveEvent,
  startRush,
  type GameState,
} from '../../src/game';
import {
  SAVE_KEY,
  BrowserSaveStore,
  EVOLUTION_NOTICE,
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
  parseEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import {
  departmentWorkforceEnvelope,
  nearBankruptcyEnvelope,
  nearVictoryEnvelope,
  livingRushEnvelope,
  reportHistoryEnvelope,
  stockLifecyclePlanningEnvelope,
} from '../fixtures/campaignFixtures';

function renderGame(): ReturnType<typeof render> {
  return render(
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

function stockLifecycleReportState(): GameState {
  const planning = stockLifecyclePlanningEnvelope().activeRun;
  if (!planning) throw new Error('Expected stock-lifecycle planning fixture.');
  let state = startRush(planning);
  let safety = 0;
  while (state.phase !== 'report' && safety < 1_000) {
    if (state.phase === 'event') {
      const choiceId = state.rush?.pendingEvent?.choices[0]?.id;
      if (!choiceId) throw new Error('Expected a resolvable rush event.');
      state = resolveEvent(state, choiceId);
    } else {
      state = advanceTick(state);
    }
    safety += 1;
  }
  if (state.phase !== 'report') throw new Error('Stock-lifecycle fixture did not finish.');
  return state;
}

describe('playable cart UI', () => {
  it('starts a campaign and enforces planning constraints', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    expect(await screen.findByRole('heading', { name: 'Set up the cart' })).toBeVisible();
    expect(document.querySelector('[data-game-layout="management"]')).toBeVisible();
    expect(document.querySelector('[data-service-section]')).not.toBeInTheDocument();
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

  it('restores colour-independent recent activity descriptions from autosave', async () => {
    let state = startRush(createCampaign({ seed: 8_018 }));
    while (state.rush?.recentActivity.length === 0) state = advanceTick(state);
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(state));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const activity = screen.getByRole('list', { name: 'Recent rush activity' });
    expect(within(activity).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(activity).toHaveTextContent(/customer d1-c\d+ arrived/i);
  });

  it('reloads a paused dense rush at current truth without presenting old evidence as motion', async () => {
    new BrowserSaveStore(window.localStorage).save(livingRushEnvelope({ paused: true }));
    const user = userEvent.setup();
    const firstView = renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const firstScene = await screen.findByRole('img', { name: /12 customers waiting/ });
    expect(firstScene).toHaveAttribute('data-last-event', 'd1-e6');
    expect(firstScene).toHaveAttribute('data-animation', 'still');
    firstView.unmount();

    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const restoredScene = await screen.findByRole('img', { name: /12 customers waiting/ });
    expect(restoredScene).toHaveAttribute('data-last-event', 'd1-e6');
    expect(restoredScene).toHaveAttribute('data-animation', 'still');
    expect(screen.getByText('SALE +$7.25')).toBeVisible();
    expect(screen.getByText('OUT OF STOCK')).toBeVisible();
  });

  it('shows every exact live stock item with active ingredients first', async () => {
    const planning = stockLifecyclePlanningEnvelope().activeRun;
    if (!planning) throw new Error('Expected stock-lifecycle planning fixture.');
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(startRush(planning)));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));

    const grid = screen.getByRole('list', { name: 'Live rush stock' });
    const items = within(grid).getAllByRole('listitem');
    expect(items).toHaveLength(9);
    expect(items.slice(0, 4).map((item) => item.querySelector('strong')?.textContent)).toEqual([
      'House blend',
      'Dairy milk',
      'Oat milk',
      'Soy milk',
    ]);
    expect(within(grid).getByText('8,500 ml', { selector: 'strong' })).toBeVisible();
    const dairy = grid.querySelector('[data-ingredient="dairyMilk"]');
    if (!dairy) throw new Error('Expected the dairy live-stock row.');
    expect(dairy).toHaveTextContent(/~\d+ serves/);
    expect(dairy).toHaveTextContent('500 ml expires after this Day 3 rush');
    const chocolate = grid.querySelector('[data-ingredient="chocolate"]');
    expect(chocolate).toHaveTextContent('0 g remaining');
    expect(chocolate).toHaveTextContent('Out of stock');
    expect(chocolate).toHaveTextContent('Not used today');
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
    expect(screen.getByText('Day 1 report · Standard')).toBeVisible();
    expect(document.querySelector('[data-service-section]')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Day 1 result summary')).toBeVisible();
    expect(screen.getByRole('table', { name: 'Cash reconciliation' })).not.toBeVisible();
    expect(screen.getByRole('heading', { name: 'Actual charges' })).not.toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Settle & reinvest' })).toHaveLength(1);
    await user.click(screen.getByText('View full Day 1 report'));
    expect(screen.getByRole('table', { name: 'Cash reconciliation' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Actual charges' })).toBeVisible();
    expect(screen.getByRole('list', { name: 'Canonical sale charges' })).toBeVisible();
    expect(screen.getByText(/matching sales revenue/i)).toBeVisible();
    expect(screen.getByRole('table', { name: 'Inventory lifecycle reconciliation' })).toBeVisible();
    expect(screen.getByText('Opening + bought − used − expired = rolled forward.')).toBeVisible();
    expect(screen.getByText('Bottleneck')).toBeVisible();
    const settle = screen.getByRole('button', { name: 'Settle & reinvest' });
    fireEvent.click(settle);
    fireEvent.click(settle);
    expect(
      await screen.findByRole('heading', { name: 'Reinvest or call it a night' }),
    ).toBeVisible();
    expect(
      parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')?.activeRun?.history,
    ).toHaveLength(1);
    expect(document.querySelector('[data-service-section]')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plan Day 2' })).toBeEnabled();
  });

  it('renders exact lifecycle conservation and the causal expiry day without losing charges', async () => {
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(stockLifecycleReportState()));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    await user.click(screen.getByText('View full Day 3 report'));

    const dairy = screen.getByRole('row', { name: /^Dairy milk/ });
    expect(dairy).toHaveTextContent('500 ml');
    expect(dairy).toHaveTextContent('8,000 ml');
    expect(dairy).toHaveTextContent(/500 ml \+ 8,000 ml − [\d,]+ ml − 500 ml = [\d,]+ ml/);
    expect(document.querySelector('.expiry-cause')).toHaveTextContent(
      /after the Day 3 rush, Dairy milk 500 ml reached the inclusive last usable day/i,
    );
    expect(screen.getByRole('heading', { name: 'Actual charges' })).toBeVisible();
    expect(screen.getByText(/matching sales revenue/i)).toBeVisible();
  });

  it('reopens selected history from report values without exposing settlement', async () => {
    new BrowserSaveStore(window.localStorage).save(reportHistoryEnvelope());
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Reports' }));
    const dialog = screen.getByRole('dialog', { name: 'Game menu' });
    expect(within(dialog).getByRole('heading', { name: 'Day 2 trading report' })).toBeVisible();
    expect(within(dialog).queryByRole('button', { name: 'Settle & reinvest' })).toBeNull();
    expect(within(dialog).getByRole('heading', { name: 'Actual charges' })).not.toBeVisible();
    await user.click(within(dialog).getByText('View full Day 2 report'));
    expect(within(dialog).getByRole('list', { name: 'Canonical sale charges' })).toBeVisible();
    expect(within(dialog).getByText(/matching sales revenue/i)).toBeVisible();

    await user.click(within(dialog).getByRole('button', { name: /Day 1/ }));
    expect(within(dialog).getByRole('heading', { name: 'Day 1 trading report' })).toBeVisible();
    expect(
      within(dialog).getByText('Charge breakdown unavailable for this older report.'),
    ).not.toBeVisible();
    await user.click(within(dialog).getByText('View full Day 1 report'));
    expect(
      within(dialog).getByText('Charge breakdown unavailable for this older report.'),
    ).toBeVisible();
  });

  it('renders separate Standard and Hard records with shared neutral unlocks', async () => {
    const meta = {
      ...createDefaultMeta(),
      endlessUnlocked: true,
      records: [
        {
          campaignId: 'standard-record',
          difficulty: 'standard' as const,
          result: 'victory' as const,
          day: 40,
          cashCents: 40_000,
          reputation: 80,
          venueId: 'departmentStore' as const,
        },
        {
          campaignId: 'hard-record',
          difficulty: 'hard' as const,
          result: 'bankruptcy' as const,
          day: 12,
          cashCents: -10_001,
          reputation: 30,
          venueId: 'kiosk' as const,
        },
      ],
    };
    new BrowserSaveStore(window.localStorage).save(
      createSaveEnvelope(createCampaign({ seed: 8_202 }), createDefaultPreferences(), meta),
    );
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Records' }));
    const dialog = screen.getByRole('dialog', { name: 'Game menu' });
    expect(within(dialog).getByRole('heading', { name: 'Standard records' })).toBeVisible();
    expect(within(dialog).getByRole('heading', { name: 'Hard records' })).toBeVisible();
    expect(within(dialog).getByText(/shared across difficulties/i)).toBeVisible();
    expect(within(dialog).getByText(/Day 40 · Department Store Coffee Hall/)).toBeVisible();
    expect(within(dialog).getByText(/Day 12 · Coffee Kiosk/)).toBeVisible();
  });

  it('hires both cart-eligible roles and schedules a daily team with visible payroll', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(await screen.findByRole('tab', { name: 'Team' }));
    const initialHireButtons = screen.getAllByRole('button', { name: /^Hire / });
    expect(initialHireButtons).toHaveLength(4);
    expect(initialHireButtons[2]).toBeDisabled();
    expect(initialHireButtons[3]).toBeDisabled();
    expect(screen.getAllByText(/hiring unlocks at the Department Store Coffee Hall/)).toHaveLength(
      2,
    );
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

  it('shows ten-person department scheduling, operational value, and accessible overflow', async () => {
    const envelope = departmentWorkforceEnvelope();
    const expectedPayroll = envelope.activeRun?.staff.reduce(
      (total, member) => total + member.wageCents,
      0,
    );
    if (expectedPayroll === undefined) throw new Error('Expected department fixture.');
    new BrowserSaveStore(window.localStorage).save(envelope);
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    await user.click(screen.getByRole('tab', { name: 'Team' }));

    expect(screen.getByText(/10\/10 scheduled/)).toBeVisible();
    expect(screen.getByText(/Roster · 10\/12 employed/)).toBeVisible();
    expect(screen.getByText(`${formatMoney(expectedPayroll)} payroll at close`)).toBeVisible();
    expect(document.querySelector('#schedule-capacity-note')).toHaveTextContent(
      'Daily schedule full',
    );
    expect(
      screen.getByRole('list', { name: 'Applied department workforce effects' }),
    ).toHaveTextContent(
      /Manager.*coordination\/reliability ticks remain.*Runner.*replenishment\/handoff ticks remain/,
    );
    expect(screen.getAllByText(/without changing stock/).length).toBeGreaterThan(0);

    let hireButtons = screen.getAllByRole('button', { name: /^Hire / });
    expect(hireButtons).toHaveLength(2);
    expect(hireButtons.every((button) => !button.hasAttribute('disabled'))).toBe(true);
    await user.click(hireButtons[0]!);
    hireButtons = screen.getAllByRole('button', { name: /^Hire / });
    await user.click(hireButtons[0]!);

    expect(screen.getByText(/Roster · 12\/12 employed/)).toBeVisible();
    const hired = screen.getByLabelText('Hired staff');
    const checkboxes = within(hired).getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(12);
    expect(checkboxes.filter((checkbox) => checkbox.hasAttribute('disabled'))).toHaveLength(2);
    expect(screen.getByText(/candidate list is empty/)).toBeVisible();
  });

  it('imports legacy data through the preferences-only v4 boundary', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Save transfer' }));
    const legacy = JSON.parse(JSON.stringify(nearVictoryEnvelope())) as Record<string, unknown>;
    legacy.schemaVersion = 3;
    legacy.preferences = {
      ...createDefaultPreferences(),
      soundEnabled: true,
      reducedMotion: true,
      onboardingComplete: true,
      activeTab: 'team',
    };
    await user.upload(
      screen.getByLabelText('Import save JSON file'),
      new File([JSON.stringify(legacy)], 'legacy-v3.json', {
        type: 'application/json',
      }),
    );
    expect(await screen.findByText(EVOLUTION_NOTICE)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Continue autosave' })).toBeNull();
    const persisted = parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '');
    expect(persisted).toMatchObject({
      schemaVersion: 4,
      activeRun: null,
      meta: createDefaultMeta(),
      preferences: {
        soundEnabled: true,
        ambienceEnabled: false,
        reducedMotion: true,
        onboardingComplete: false,
        activeTab: 'plan',
        evolutionNoticeSeen: true,
      },
    });
  });

  it('fails a legacy import closed when browser storage is unavailable', async () => {
    const unavailableStorage = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is blocked.', 'SecurityError');
    });
    const user = userEvent.setup();
    renderGame();
    expect(
      await screen.findByText(
        'Browser storage is unavailable. You can still play, but this run may not persist.',
      ),
    ).toBeVisible();
    unavailableStorage.mockRestore();

    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Save transfer' }));
    const legacy = JSON.parse(JSON.stringify(nearVictoryEnvelope())) as Record<string, unknown>;
    legacy.schemaVersion = 3;
    legacy.preferences = {
      ...createDefaultPreferences(),
      soundEnabled: true,
      reducedMotion: true,
      onboardingComplete: true,
      activeTab: 'team',
    };
    await user.upload(
      screen.getByLabelText('Import save JSON file'),
      new File([JSON.stringify(legacy)], 'legacy-without-storage.json', {
        type: 'application/json',
      }),
    );

    expect(
      await screen.findByText(
        'Browser storage is unavailable, so the imported save was not applied.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Import rejected; current data is unchanged.')).toBeVisible();
    expect(screen.queryByText(EVOLUTION_NOTICE)).not.toBeInTheDocument();
    expect(screen.queryByText('Save imported and verified.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue autosave' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(document.documentElement).toHaveAttribute('data-reduced-motion', 'false');

    await user.click(screen.getByRole('tab', { name: 'Records' }));
    expect(screen.getByText('No Standard outcomes yet.')).toBeVisible();
    expect(screen.getByText('No Hard outcomes yet.')).toBeVisible();
    expect(screen.getByText(/Endless mode:/)).toHaveTextContent('Win once to unlock');
    await user.click(screen.getByRole('button', { name: 'Close game menu' }));
    expect(screen.getByRole('heading', { name: 'Laneway Tycoon' })).toBeVisible();
    expect(screen.getByRole('radio', { name: /Standard/ })).toBeChecked();
  });

  it('preselects Standard while keeping scenario and difficulty independent', async () => {
    const meta = {
      ...createDefaultMeta(),
      scenarios: ['lanewayClassic', 'rainySeason'] as const,
    };
    new BrowserSaveStore(window.localStorage).save(
      createSaveEnvelope(null, createDefaultPreferences(), {
        ...meta,
        scenarios: [...meta.scenarios],
      }),
    );
    const user = userEvent.setup();
    renderGame();
    const standard = screen.getByRole('radio', { name: /Standard/ });
    const hard = screen.getByRole('radio', { name: /Hard/ });
    const scenario = screen.getByRole('combobox', { name: 'Scenario' });
    expect(standard).toBeChecked();
    expect(hard).not.toBeChecked();
    await user.selectOptions(scenario, 'rainySeason');
    await user.click(hard);
    expect(scenario).toHaveValue('rainySeason');
    expect(hard).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    expect(
      await screen.findByRole('dialog', { name: 'Welcome to your laneway' }),
    ).toHaveTextContent('Hard difficulty is locked for this run');
    expect(parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')?.activeRun).toMatchObject({
      difficulty: 'hard',
      scenarioId: 'rainySeason',
    });
    expect(screen.queryByRole('radio', { name: /Hard/ })).toBeNull();
  });

  it('buys equipment and promotes the same venue through the department-store hall', async () => {
    const reinvest = {
      ...closeDay(stateAtReport()),
      cashCents: 200_000,
      reputation: 80,
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
    expect(screen.getByRole('heading', { name: /Day 1\/40 · Coffee Kiosk/ })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /Buy Grinder level 2/ }));
    await user.click(screen.getByRole('button', { name: /Buy Espresso machine level 2/ }));
    await user.click(screen.getByRole('button', { name: /Buy Refrigeration level 1/ }));
    await user.click(screen.getByRole('button', { name: /Buy Point of sale level 1/ }));
    const cafePromotion = screen.getByRole('button', { name: 'Promote to Specialty Cafe' });
    expect(cafePromotion).toBeEnabled();
    await user.click(cafePromotion);
    expect(screen.getByRole('heading', { name: /Day 1\/40 · Specialty Cafe/ })).toBeVisible();
    expect(screen.getByText(/Commercial grinder bank · \$85\.00 purchase/)).toHaveTextContent(
      /requires Department Store Coffee Hall.*99% reliability.*\$2\.80\/day maintenance/,
    );
    const departmentPromotion = screen.getByRole('button', {
      name: 'Promote to Department Store Coffee Hall',
    });
    expect(departmentPromotion).toBeEnabled();
    await user.click(departmentPromotion);
    expect(
      screen.getByRole('heading', { name: /Day 1\/40 · Department Store Coffee Hall/ }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Buy Grinder level 3/ }));
    expect(screen.getByText('Level 3/3')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Reinvest or call it a night' })).toBeVisible();
    expect(document.querySelector('[data-game-layout="management"]')).toBeVisible();
    expect(document.querySelector('[data-service-section]')).not.toBeInTheDocument();
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
    await user.click(screen.getByText('View full Day 40 report'));
    expect(screen.getByText(/Lifecycle detail is unavailable for this older save/)).toBeVisible();
    expect(screen.getByText('Charge breakdown unavailable for this older report.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Settle & reinvest' }));
    expect(await screen.findByRole('heading', { name: /coffee institution/ })).toBeVisible();
    expect(document.querySelector('[data-service-section]')).not.toBeInTheDocument();
    expect(screen.getByText(/Unlocked: endless mode/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Continue in endless mode' }));
    expect(
      screen.getByRole('heading', { name: /Day 41 · Endless · Department Store Coffee Hall/ }),
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
    await user.click(await screen.findByRole('button', { name: 'Settle & reinvest' }));
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
    expect(await screen.findByRole('heading', { name: /Day 1\/40 · Coffee Cart/ })).toBeVisible();
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(serializeEnvelope(first));
  });
});
