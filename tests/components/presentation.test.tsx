import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import { SERVICE_DASHBOARD_FIELDS } from '../../src/components/RushPanel';
import { BrowserSaveStore, parseEnvelope, SAVE_KEY } from '../../src/persistence/saveStore';
import { WebGLBoundary } from '../../src/scene/three/WebGLBoundary';
import { denseDepartmentRushEnvelope, livingRushEnvelope } from '../fixtures/campaignFixtures';

let playMock: ReturnType<typeof vi.fn<() => Promise<void>>>;

describe('snapshot presentation and audio consent', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    playMock = vi.fn(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  it('keeps planning scene-free and stops the service world for reduced motion', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    expect(await screen.findByRole('heading', { name: 'Set up the cart' })).toBeVisible();
    expect(document.querySelector('[data-game-layout="management"]')).toBeVisible();
    expect(document.querySelector('[data-service-section]')).not.toBeInTheDocument();
    expect(document.querySelector('canvas')).not.toBeInTheDocument();

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

  it('renders a complete service dashboard in the required document order', async () => {
    new BrowserSaveStore(window.localStorage).save(livingRushEnvelope({ paused: true }));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));

    expect(
      [...document.querySelectorAll('[data-service-section]')].map((element) =>
        element.getAttribute('data-service-section'),
      ),
    ).toEqual(['scene', 'dashboard', 'activity', 'stock']);
    for (const field of SERVICE_DASHBOARD_FIELDS) {
      expect(document.querySelector(`[data-dashboard-field="${field}"]`)).toBeVisible();
    }
    const dashboard = document.querySelector('[data-service-section="dashboard"]');
    if (!(dashboard instanceof HTMLElement)) throw new Error('Service dashboard is missing.');
    expect(within(dashboard).getByText('Cash')).toBeVisible();
    expect(within(dashboard).getByText('Revenue')).toBeVisible();
    expect(within(dashboard).getByText('Satisfaction')).toBeVisible();
    expect(within(dashboard).getByText('No active service decision')).toBeVisible();
    expect(document.querySelector('canvas[width="320"]')).not.toBeInTheDocument();
  });

  it('keeps audio off initially, then persists independent consent controls', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');
    renderGame();
    expect(playMock).not.toHaveBeenCalled();

    const gameMenu = await screen.findByRole('button', { name: 'Game menu' });
    expect(createElementSpy.mock.calls.filter(([tagName]) => tagName === 'audio')).toHaveLength(0);
    await user.click(gameMenu);
    await waitFor(() =>
      expect(createElementSpy.mock.calls.filter(([tagName]) => tagName === 'audio')).toHaveLength(
        3,
      ),
    );
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
    expect(createElementSpy.mock.calls.filter(([tagName]) => tagName === 'audio')).toHaveLength(3);
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
    {
      venueId: 'cart' as const,
      staffCount: 2,
      visibleCustomers: 12,
      weather: 'sunny' as const,
      world: 'laneway-cart',
    },
    {
      venueId: 'kiosk' as const,
      staffCount: 3,
      visibleCustomers: 12,
      weather: 'rainy' as const,
      world: 'sheltered-coffee-kiosk',
    },
    {
      venueId: 'cafe' as const,
      staffCount: 5,
      visibleCustomers: 12,
      weather: 'coldSnap' as const,
      world: 'laneway-specialty-cafe',
    },
    {
      venueId: 'departmentStore' as const,
      staffCount: 8,
      visibleCustomers: 13,
      weather: 'mild' as const,
      world: 'heritage-department-store-coffee-hall',
    },
  ])('routes $venueId service exclusively through its complete WebGL world', async (fixture) => {
    new BrowserSaveStore(window.localStorage).save(
      livingRushEnvelope({
        equipment: {
          grinder: 3,
          espressoMachine: 3,
          batchBrewer: 3,
          refrigeration: 3,
          pos: 3,
          serviceCounter: 3,
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
    expect(frame).toHaveAttribute('data-visible-customers', String(fixture.visibleCustomers));
    expect(frame).toHaveAttribute(
      'data-max-visible-customers',
      fixture.venueId === 'departmentStore' ? '18' : '12',
    );
    expect(frame).toHaveAttribute('data-max-visible-staff', '10');
    expect(frame).toHaveAttribute(
      'data-equipment',
      'grinder:3,espressoMachine:3,batchBrewer:3,refrigeration:3,pos:3,serviceCounter:3',
    );
    expect(frame).toHaveAttribute(
      'data-queue-capacity',
      ({ cart: '16', kiosk: '19', cafe: '23', departmentStore: '32' } as const)[fixture.venueId],
    );
    expect(screen.getByText('+4 beyond view')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('3D service needs WebGL 2');
    expect(document.querySelector('[data-renderer-bridge]')).not.toBeInTheDocument();
    expect(document.querySelector('canvas[width="320"]')).not.toBeInTheDocument();
  });

  it('exposes complete dense department truth, registries, and static lifecycle parity', async () => {
    new BrowserSaveStore(window.localStorage).save(denseDepartmentRushEnvelope(true));
    const user = userEvent.setup();
    renderGame();
    await user.click(await screen.findByRole('button', { name: 'Continue autosave' }));

    const scene = screen.getByRole('img', { name: /30 customers waiting/ });
    const frame = scene.closest('figure');
    expect(frame).toHaveAttribute('data-animation', 'still');
    expect(frame).toHaveAttribute('data-queue-count', '30');
    expect(frame).toHaveAttribute('data-queue-normal', '12');
    expect(frame).toHaveAttribute('data-queue-express', '18');
    expect(frame).toHaveAttribute('data-queue-overflow', '18');
    expect(frame).toHaveAttribute('data-visible-customers', '18');
    expect(frame).toHaveAttribute('data-max-visible-customers', '18');
    expect(frame).toHaveAttribute('data-staff-count', '10');
    expect(frame).toHaveAttribute('data-active-job-ids', 'd3-j0,d3-j1,d3-j2');
    expect(frame).toHaveAttribute('data-draw-call-budget', '72');
    expect(frame).toHaveAttribute('data-triangle-budget', '60000');
    expect(frame).toHaveAttribute('data-effect-cap', '6');
    expect(frame).toHaveAttribute(
      'data-motif-registry',
      'patterned-heritage-tiles,timber-panelling-counters,brass-rails-details,visible-escalators,three-distinct-service-bays',
    );
    expect(frame).toHaveAttribute(
      'data-equipment-registry',
      'grinder,espressoMachine,batchBrewer,refrigeration,pos,serviceCounter',
    );
    expect(frame).toHaveAttribute(
      'data-upgrade-anchor-registry',
      'hallEntry,espressoBay,brewBay,coldBay',
    );
    expect(frame).toHaveAttribute('data-bay-registry', 'espressoBar,brewBar,coldBar');
    expect(frame?.getAttribute('data-customer-entity-ids')?.split(',')).toHaveLength(18);
    expect(frame?.getAttribute('data-staff-entity-ids')?.split(',')).toHaveLength(10);
    expect(scene).toHaveAccessibleName(/3 active service jobs/);
    expect(scene).toHaveAccessibleName(/12 normal, 18 express/);
    expect(screen.getByText('+18 beyond view')).toBeVisible();
    expect(screen.getByRole('list', { name: 'Live station service' })).toHaveTextContent(
      'Espresso',
    );
    expect(screen.getByRole('list', { name: 'Recent rush activity' })).toHaveTextContent('d3-c40');
    expect(screen.getByRole('list', { name: 'Recent rush activity' })).toHaveTextContent('d3-c42');
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
