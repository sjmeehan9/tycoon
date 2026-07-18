import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import { createCampaign, prepareDay } from '../../src/game';
import {
  SAVE_KEY,
  BrowserSaveStore,
  createSaveEnvelope,
  parseEnvelope,
} from '../../src/persistence/saveStore';

function renderGame(): void {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}

describe('exact accessible planner controls', () => {
  it('uses atomic buttons, announces values, and persists keyboard and rapid activations', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));

    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    const price = screen.getByRole('group', { name: 'Flat White price' });
    const increase = within(price).getByRole('button', {
      name: 'Increase Flat White price by $0.10',
    });
    const decrease = within(price).getByRole('button', {
      name: 'Decrease Flat White price by $0.10',
    });
    expect(within(price).getByText('$5.50', { selector: 'output' })).toHaveAttribute(
      'aria-live',
      'polite',
    );

    await user.dblClick(increase);
    expect(within(price).getByText('$5.70', { selector: 'output' })).toBeVisible();
    increase.focus();
    await user.keyboard('{Enter}');
    expect(within(price).getByText('$5.80', { selector: 'output' })).toBeVisible();
    decrease.focus();
    await user.keyboard(' ');
    expect(within(price).getByText('$5.70', { selector: 'output' })).toBeVisible();

    const saved = parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '');
    expect(saved?.activeRun?.plan.pricesCents.flatWhite).toBe(570);

    await user.click(screen.getByRole('tab', { name: 'Supplies' }));
    const ice = screen.getByRole('group', { name: 'Ice · 20 serves package quantity' });
    expect(within(ice).getByRole('button', { name: /^Decrease/ })).toBeDisabled();
    await user.click(within(ice).getByRole('button', { name: /^Increase/ }));
    expect(within(ice).getByText('1', { selector: 'output' })).toBeVisible();
  });

  it('disables controls at configured bounds and for drinks outside the active menu', async () => {
    let state = createCampaign({ seed: 57 });
    state = { ...state, cashCents: 100_000 };
    state = prepareDay(state, {
      pricesCents: { flatWhite: 1_200, longBlack: 250 },
      purchases: { houseBeans: 20 },
    });
    new BrowserSaveStore(window.localStorage).save(createSaveEnvelope(state));
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Continue autosave' }));

    const price = screen.getByRole('group', { name: 'Flat White price' });
    expect(within(price).getByRole('button', { name: /^Increase/ })).toBeDisabled();
    expect(within(price).getByRole('button', { name: /^Decrease/ })).toBeEnabled();
    const minimumPrice = screen.getByRole('group', { name: 'Long Black price' });
    expect(within(minimumPrice).getByRole('button', { name: /^Decrease/ })).toBeDisabled();
    expect(within(minimumPrice).getByRole('button', { name: /^Increase/ })).toBeEnabled();

    const inactivePrice = screen.getByRole('group', { name: 'Espresso price' });
    expect(within(inactivePrice).getAllByRole('button')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ disabled: true }),
        expect.objectContaining({ disabled: true }),
      ]),
    );

    await user.click(screen.getByRole('tab', { name: 'Supplies' }));
    const beans = screen.getByRole('group', {
      name: 'House blend · 500 g package quantity',
    });
    expect(within(beans).getByRole('button', { name: /^Increase/ })).toBeDisabled();
    expect(within(beans).getByRole('button', { name: /^Decrease/ })).toBeEnabled();
  });

  it('announces exact post-purchase stock, weighted serves, unused stock, and expiry immediately', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(screen.getByRole('tab', { name: 'Supplies' }));

    const beansCapacity = screen.getByLabelText(
      'House blend usable stock and weighted serves after selected purchase',
    );
    expect(beansCapacity).toHaveAttribute('aria-live', 'polite');
    expect(beansCapacity).toHaveAttribute('aria-atomic', 'true');
    expect(beansCapacity).toHaveTextContent('500 g usable after order');
    expect(beansCapacity).toHaveTextContent('0 g carried + 500 g pending');
    expect(beansCapacity).toHaveTextContent(/~\d+ serves/);
    expect(beansCapacity).toHaveTextContent('500 g expires after Day 3 rush');

    const beans = screen.getByRole('group', {
      name: 'House blend · 500 g package quantity',
    });
    await user.click(within(beans).getByRole('button', { name: /^Increase/ }));
    expect(beansCapacity).toHaveTextContent('1,000 g usable after order');
    expect(beansCapacity).toHaveTextContent('0 g carried + 1,000 g pending');

    const chocolateCapacity = screen.getByLabelText(
      'Chocolate usable stock and weighted serves after selected purchase',
    );
    expect(chocolateCapacity).toHaveTextContent('Not used today');
    expect(chocolateCapacity.textContent).not.toMatch(/~\d+ serves/);
  });

  it('retains the last affordable supply value and surfaces rejected increments', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(screen.getByRole('tab', { name: 'Supplies' }));
    const beans = screen.getByRole('group', {
      name: 'House blend · 500 g package quantity',
    });
    const increase = within(beans).getByRole('button', { name: /^Increase/ });
    for (let index = 0; index < 17; index += 1) await user.click(increase);
    expect(within(beans).getByText('17', { selector: 'output' })).toBeVisible();
    expect(screen.getByText(/supplies exceed the available cash/i)).toBeVisible();
  });
});
