import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import {
  advanceTick,
  createCampaign,
  resolveEvent,
  startRush,
  type GameState,
} from '../../src/game';
import { BrowserSaveStore, createSaveEnvelope } from '../../src/persistence/saveStore';

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
    expect(await screen.findByRole('status')).toHaveTextContent('Choose between 1 and 3');
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

  it('renders and resolves the seeded event dialog', async () => {
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(stateAtEvent()));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('office coffee run');
    await user.click(screen.getByRole('button', { name: /Protect the queue/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'The laneway is moving' })).toBeVisible();
  });

  it('shows report semantics and allows settlement and reinvestment', async () => {
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(stateAtReport()));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    expect(await screen.findByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    expect(screen.getByRole('table', { name: 'Cash reconciliation' })).toBeVisible();
    expect(screen.getByText('Bottleneck')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Settle the day' }));
    expect(
      await screen.findByRole('heading', { name: 'Reinvest or call it a night' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Plan Day 2' })).toBeEnabled();
  });
});
