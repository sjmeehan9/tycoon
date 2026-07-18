import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import { BrowserSaveStore, SAVE_KEY, parseEnvelope } from '../../src/persistence/saveStore';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

describe('onboarding and accessible interaction', () => {
  it('follows real first-day phases and supports skip/replay', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    const onboarding = screen.getByRole('dialog', { name: 'Welcome to your laneway' });
    const showStep = screen.getByRole('button', { name: 'Show current step' });
    const skip = screen.getByRole('button', { name: 'Skip onboarding' });
    expect(onboarding).toBeVisible();
    expect(showStep).toHaveFocus();
    await user.tab({ shift: true });
    expect(skip).toHaveFocus();
    await user.tab();
    expect(showStep).toHaveFocus();
    await user.click(showStep);
    expect(screen.getByText('First-day guide · step 1/4')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Open the cart' }));
    expect(screen.getByText('First-day guide · step 2/4')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Skip guide' }));
    expect(screen.queryByText(/First-day guide/)).not.toBeInTheDocument();
    expect(parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '')?.preferences).toMatchObject({
      onboardingComplete: true,
    });

    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Help' }));
    await user.click(screen.getByRole('button', { name: 'Replay onboarding' }));
    expect(screen.getByText('First-day guide · step 2/4')).toBeVisible();
  });

  it('restores game-menu focus on Escape and supports arrow-key tab activation', async () => {
    const user = userEvent.setup();
    renderGame();
    const trigger = screen.getByRole('button', { name: 'Game menu' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Close game menu' })).toHaveFocus();
    const settings = screen.getByRole('tab', { name: 'Settings' });
    settings.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Records' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Records' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('applies arrow-key planning tabs and phase-level announcements without tick chatter', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(screen.getByRole('button', { name: 'Show current step' }));
    const menu = screen.getByRole('tab', { name: 'Menu' });
    menu.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Supplies' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Supplies' })).toBeInTheDocument();
    expect(screen.getByText('Day 1 planning at the Coffee Cart.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open the cart' }));
    expect(screen.getByText('Service rush active at the Coffee Cart.')).toBeInTheDocument();
    expect(
      screen.getByText(/Making |Calling the next order|rare quiet second/),
    ).not.toHaveAttribute('aria-live');
  });

  it('provides reduced-motion parity for queue, counter, sale, and walkaway evidence', async () => {
    new BrowserSaveStore(window.localStorage).save(
      livingRushEnvelope({ paused: true, reducedMotion: true }),
    );
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const scene = screen.getByRole('img', { name: /12 customers waiting/ });
    expect(scene).toHaveAccessibleName(/At the counter: Enthusiast customer d1-c1/);
    expect(scene).toHaveAccessibleName(/Latest sale: Student customer d1-c20.*paid \$7.25/);
    expect(scene).toHaveAccessibleName(
      /Latest walkaway: Commuter customer d1-c21 left because their order was out of stock/,
    );
    expect(screen.getByRole('list', { name: 'Recent rush activity' })).toHaveTextContent(
      'started large oat Flat White service',
    );
    expect(scene).toHaveAttribute('data-animation', 'still');
  });
});

function renderGame(): void {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}
