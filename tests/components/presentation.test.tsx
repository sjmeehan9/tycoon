import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import { BrowserSaveStore, parseEnvelope, SAVE_KEY } from '../../src/persistence/saveStore';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

let playMock: ReturnType<typeof vi.fn<() => Promise<void>>>;

describe('pixel presentation and audio consent', () => {
  beforeEach(() => {
    playMock = vi.fn(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  it('renders a fixed-resolution textual scene and stops animation for reduced motion', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    const scene = screen.getByRole('img', { name: /Coffee Cart in/ });
    expect(scene).toHaveAttribute('width', '320');
    expect(scene).toHaveAttribute('height', '180');
    expect(scene).toHaveAttribute('data-animation', 'still');

    await user.click(screen.getByRole('button', { name: 'Open the cart' }));
    expect(scene).toHaveAttribute('data-animation', 'active');
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('checkbox', { name: 'Reduce motion' }));
    expect(scene).toHaveAttribute('data-animation', 'still');
  });

  it('keeps audio off initially, then persists independent consent controls', async () => {
    const user = userEvent.setup();
    renderGame();
    expect(playMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    const sounds = screen.getByRole('checkbox', { name: 'Interface sounds' });
    const ambience = screen.getByRole('checkbox', { name: 'Cafe ambience' });
    expect(sounds).not.toBeChecked();
    expect(ambience).not.toBeChecked();
    await user.click(sounds);
    await user.click(ambience);

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(2));
    const saved = parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '');
    expect(saved?.preferences).toMatchObject({ soundEnabled: true, ambienceEnabled: true });
  });

  it('renders exact dense-rush truth with static reduced-motion evidence', async () => {
    const fillText = vi.fn<(text: string, x: number, y: number) => void>();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          fillText,
          imageSmoothingEnabled: false,
          fillStyle: '',
          font: '',
        }) as unknown as CanvasRenderingContext2D,
    );
    new BrowserSaveStore(window.localStorage).save(
      livingRushEnvelope({ paused: true, reducedMotion: true }),
    );
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));

    const scene = screen.getByRole('img', { name: /12 customers waiting/ });
    expect(scene).toHaveAttribute('data-animation', 'still');
    expect(scene).toHaveAttribute('data-queue-count', '12');
    expect(scene).toHaveAttribute('data-queue-overflow', '4');
    expect(scene).toHaveAttribute('data-active-customer', 'd1-c1');
    expect(scene).toHaveAttribute('data-last-event', 'd1-e6');
    expect(scene.closest('figure')).toHaveAttribute('data-reduced-motion', 'true');
    expect(screen.getByText('QUEUE 12')).toBeVisible();
    expect(screen.getByText('+4 beyond view')).toBeVisible();
    expect(screen.getByText('SALE +$7.25')).toBeVisible();
    expect(screen.getByText('OUT OF STOCK')).toBeVisible();
    expect(
      screen.getByText(/Last sale: Large oat Flat White — \$7.25 actual charge/),
    ).toBeVisible();
    expect(document.querySelector('.last-walkaway-note')).toHaveTextContent(
      /Latest walkaway:.*out of stock/i,
    );
    await waitFor(() =>
      expect(fillText.mock.calls.map(([label]) => label)).toEqual(
        expect.arrayContaining(['QUEUE 12', 'SALE +$7.25', 'OUT OF STOCK']),
      ),
    );
  });

  it('freezes, resumes, and re-freezes bounded Canvas motion at the persisted 4× speed', async () => {
    new BrowserSaveStore(window.localStorage).save(livingRushEnvelope({ paused: true }));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const scene = screen.getByRole('img', { name: /12 customers waiting/ });
    expect(scene).toHaveAttribute('data-animation', 'still');
    expect(scene).toHaveAttribute('data-speed', '4');

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(scene).toHaveAttribute('data-animation', 'active');
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(scene).toHaveAttribute('data-animation', 'still');
    expect(scene.closest('figure')).toHaveAttribute('data-paused', 'true');
  });
});

function renderGame(): void {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}
