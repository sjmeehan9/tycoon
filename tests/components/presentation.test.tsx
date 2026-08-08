import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import { BrowserSaveStore, parseEnvelope, SAVE_KEY } from '../../src/persistence/saveStore';
import { WebGLBoundary } from '../../src/scene/three/WebGLBoundary';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

let playMock: ReturnType<typeof vi.fn<() => Promise<void>>>;

describe('snapshot presentation and audio consent', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    playMock = vi.fn(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  it('renders a fixed-resolution textual scene and stops animation for reduced motion', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    const planningScene = await screen.findByRole('img', { name: /Coffee Cart in/ });
    expect(planningScene).toHaveAttribute('width', '320');
    expect(planningScene).toHaveAttribute('height', '180');
    expect(planningScene).toHaveAttribute('data-animation', 'still');

    await user.click(screen.getByRole('button', { name: 'Open the cart' }));
    const serviceScene = await screen.findByRole('img', { name: /Coffee Cart in/ });
    expect(serviceScene.closest('figure')).toHaveAttribute('data-renderer', 'webgl');
    expect(serviceScene.closest('figure')).toHaveAttribute('data-animation', 'active');
    expect(screen.getByRole('alert')).toHaveTextContent('3D service needs WebGL 2');
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('checkbox', { name: 'Reduce motion' }));
    expect(serviceScene.closest('figure')).toHaveAttribute('data-animation', 'still');
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
    new BrowserSaveStore(window.localStorage).save(
      livingRushEnvelope({ paused: true, reducedMotion: true }),
    );
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));

    const scene = screen.getByRole('img', { name: /12 customers waiting/ });
    const frame = scene.closest('figure');
    expect(frame).toHaveAttribute('data-animation', 'still');
    expect(frame).toHaveAttribute('data-queue-count', '12');
    expect(frame).toHaveAttribute('data-queue-overflow', '0');
    expect(frame).toHaveAttribute('data-last-event', 'd1-e6');
    expect(frame).toHaveAttribute('data-reduced-motion', 'true');
    expect(frame).toHaveAttribute('data-snapshot-only', 'true');
    expect(screen.getByText('QUEUE 12')).toBeVisible();
    expect(screen.getByText('SALE +$7.25')).toBeVisible();
    expect(screen.getByText('OUT OF STOCK')).toBeVisible();
    expect(
      screen.getByText(/Last sale: Large oat Flat White — \$7.25 actual charge/),
    ).toBeVisible();
    expect(document.querySelector('.last-walkaway-note')).toHaveTextContent(
      /Latest walkaway:.*out of stock/i,
    );
  });

  it.each([
    { venueId: 'cart' as const, staffCount: 2, weather: 'sunny' as const, world: 'laneway-cart' },
    {
      venueId: 'kiosk' as const,
      staffCount: 3,
      weather: 'rainy' as const,
      world: 'sheltered-coffee-kiosk',
    },
    {
      venueId: 'cafe' as const,
      staffCount: 5,
      weather: 'coldSnap' as const,
      world: 'laneway-specialty-cafe',
    },
  ])('routes $venueId service exclusively through its complete WebGL world', async (fixture) => {
    new BrowserSaveStore(window.localStorage).save(
      livingRushEnvelope({
        equipment: {
          grinder: 2,
          espressoMachine: 2,
          batchBrewer: 2,
          refrigeration: 2,
          pos: 2,
          serviceCounter: 2,
        },
        queueCount: 16,
        scheduledStaffCount: fixture.staffCount,
        venueId: fixture.venueId,
        weather: fixture.weather,
      }),
    );
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const scene = await screen.findByRole('img', { name: /16 customers waiting/ });
    const frame = scene.closest('figure');
    expect(frame).toHaveAttribute('data-renderer', 'webgl');
    expect(frame).toHaveAttribute('data-venue', fixture.venueId);
    expect(frame).toHaveAttribute('data-world', fixture.world);
    expect(frame).toHaveAttribute('data-queue-count', '16');
    expect(frame).toHaveAttribute('data-queue-overflow', '4');
    expect(frame).toHaveAttribute('data-staff-count', String(fixture.staffCount));
    expect(frame).toHaveAttribute('data-weather', fixture.weather);
    expect(frame).toHaveAttribute('data-light-count', '2');
    expect(frame).toHaveAttribute('data-shadow-light-count', '1');
    expect(frame).toHaveAttribute('data-visible-customers', '12');
    expect(frame).toHaveAttribute('data-max-visible-customers', '12');
    expect(frame).toHaveAttribute('data-max-visible-staff', '10');
    expect(frame).toHaveAttribute(
      'data-equipment',
      'grinder:2,espressoMachine:2,batchBrewer:2,refrigeration:2,pos:2,serviceCounter:2',
    );
    expect(screen.getByText('+4 beyond view')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('3D service needs WebGL 2');
    expect(document.querySelector('[data-renderer-bridge]')).not.toBeInTheDocument();
    expect(document.querySelector('canvas[width="320"]')).not.toBeInTheDocument();
  });

  it('freezes, resumes, and re-freezes local WebGL motion at the persisted 4× speed', async () => {
    new BrowserSaveStore(window.localStorage).save(livingRushEnvelope({ paused: true }));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));
    const scene = screen.getByRole('img', { name: /12 customers waiting/ });
    const frame = scene.closest('figure');
    expect(frame).toHaveAttribute('data-animation', 'still');
    expect(frame).toHaveAttribute('data-speed', '4');

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(frame).toHaveAttribute('data-animation', 'active');
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(frame).toHaveAttribute('data-animation', 'still');
    expect(frame).toHaveAttribute('data-paused', 'true');
  });

  it('handles an explicit WebGL2 context loss without a Canvas fallback or game command', async () => {
    class FakeWebGL2RenderingContext {}
    vi.stubGlobal('WebGL2RenderingContext', FakeWebGL2RenderingContext);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (contextId) =>
        (contextId === 'webgl2'
          ? new FakeWebGL2RenderingContext()
          : null) as unknown as RenderingContext,
    );
    const user = userEvent.setup();
    render(
      <WebGLBoundary sceneLabel="Snapshot-only test world">
        {({ generation }) => <canvas data-generation={generation} data-testid="registered-webgl" />}
      </WebGLBoundary>,
    );
    const canvas = await screen.findByTestId('registered-webgl');
    const lost = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(await screen.findByRole('alert')).toHaveTextContent('3D context was interrupted');
    expect(document.querySelector('canvas[role="img"]')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry 3D scene' }));
    expect(await screen.findByTestId('registered-webgl')).toHaveAttribute('data-generation', '1');
  });
});

function renderGame(): void {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}
