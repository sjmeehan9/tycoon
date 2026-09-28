import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { BasicShadowMap, OrthographicCamera } from 'three';

import { useGame } from '../../app/GameContext';
import { describeRushActivity, formatMoney } from '../../game';
import { MAX_SCENE_CUSTOMERS, MAX_SCENE_EFFECTS, MAX_SCENE_STAFF } from '../sceneModel';
import { configureServiceCamera } from './camera';
import {
  boundedDepartmentDevicePixelRatio,
  boundedDevicePixelRatio,
  CART_PALETTE,
  COMPACT_SHADOW_MAP_SIZE,
  DEPARTMENT_FULL_RENDER_SCALE,
  MAX_DEVICE_PIXEL_RATIO,
  SHADOW_MAP_SIZE,
} from './materials';
import { createRenderSnapshot, type RenderSnapshot } from './renderSnapshot';
import { CafeWorld } from './venues/CafeWorld';
import { CartWorld } from './venues/CartWorld';
import { DepartmentStoreWorld } from './venues/DepartmentStoreWorld';
import {
  DEPARTMENT_EQUIPMENT_REGISTRY,
  DEPARTMENT_FRAME_PERFORMANCE_BUDGET,
  DEPARTMENT_HERITAGE_MOTIFS,
  DEPARTMENT_LAYOUT,
  DEPARTMENT_PHYSICAL_UPGRADE_REGISTRY,
  departmentPerformanceBudget,
  type DepartmentLod,
} from './venues/departmentLayout';
import { KioskWorld } from './venues/KioskWorld';
import { venueLayoutFor } from './venues/venueLayout';
import { WebGLBoundary } from './WebGLBoundary';

const COMPACT_SCENE_QUERY = '(max-width: 620px), (max-height: 500px)';
const FRAME_SAMPLE_COUNT = 120;
const FRAME_WARMUP_COUNT = 30;

/** Lazy, snapshot-only WebGL service renderer for every campaign venue. */
export function ServiceWorld(): React.JSX.Element | null {
  const { game, meta, preferences } = useGame();
  const compactViewport = useCompactViewport();
  const snapshot = useMemo(
    () =>
      game && (game.phase === 'rush' || game.phase === 'event')
        ? createRenderSnapshot(game, preferences.reducedMotion, meta.cosmetics)
        : null,
    [game, meta.cosmetics, preferences.reducedMotion],
  );
  if (!snapshot) return null;

  const isDepartment = snapshot.identity.venueId === 'departmentStore';
  const lod: DepartmentLod = isDepartment && compactViewport ? 'compact' : 'full';
  const venueLayout = venueLayoutFor(snapshot.identity.venueId);
  const departmentBudget = departmentPerformanceBudget(lod);
  const frameBudget = DEPARTMENT_FRAME_PERFORMANCE_BUDGET[lod];
  const overflow = snapshot.service.queueSummary.omitted;
  const latestSale = snapshot.service.activity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot.service.activity.findLast((event) => event.type === 'walkaway');
  const lastActivity = snapshot.service.activity.at(-1);
  const lowStock = snapshot.operation.stock.filter(({ level }) => level !== 'available');
  const equipmentLabel = Object.entries(snapshot.operation.equipment)
    .filter(([, level]) => level > 0)
    .map(([equipment, level]) => `${equipment}:${level}`)
    .join(',');
  const activeJobIds = snapshot.service.activeJobs.map(({ jobId }) => jobId).join(',');
  const customerIds = snapshot.service.customers.map(({ entityId }) => entityId).join(',');
  const customerStatuses = snapshot.service.customers
    .map(({ entityId, status }) => `${entityId}:${status}`)
    .join(',');
  const staffIds = snapshot.service.staff.map(({ entityId }) => entityId).join(',');
  const maxVisibleCustomers = isDepartment
    ? MAX_SCENE_CUSTOMERS
    : venueLayout.performance.maxVisibleCustomers;
  const visibleCustomers = isDepartment
    ? snapshot.service.customers.length
    : snapshot.service.queue.length;

  return (
    <figure
      className="scene-frame webgl-service-world"
      data-active-customer={snapshot.service.active?.id ?? 'none'}
      data-active-job-ids={activeJobIds || 'none'}
      data-animation={snapshot.presentation.animate ? 'active' : 'still'}
      data-antialias={isDepartment ? 'false' : 'true'}
      data-bay-registry={
        isDepartment ? Object.keys(DEPARTMENT_LAYOUT.stations).join(',') : undefined
      }
      data-budget-status="pending"
      data-camera="orthographic-isometric"
      data-colour-update-policy="snapshot"
      data-customer-entity-ids={customerIds}
      data-customer-statuses={customerStatuses}
      data-dpr-max={isDepartment ? departmentBudget.devicePixelRatio : MAX_DEVICE_PIXEL_RATIO}
      data-draw-call-budget={isDepartment ? departmentBudget.drawCalls : 72}
      data-effect-cap={isDepartment ? MAX_SCENE_EFFECTS : 0}
      data-equipment={equipmentLabel}
      data-equipment-registry={isDepartment ? DEPARTMENT_EQUIPMENT_REGISTRY.join(',') : undefined}
      data-frame-budget-status={
        isDepartment && snapshot.presentation.animate ? 'pending' : 'not-applicable'
      }
      data-frame-sample-count={isDepartment ? FRAME_SAMPLE_COUNT : undefined}
      data-frame-warmup-count={isDepartment ? FRAME_WARMUP_COUNT : undefined}
      data-instanced-people="true"
      data-last-event={lastActivity?.id ?? 'none'}
      data-layout={`${venueLayout.floor.width}x${venueLayout.floor.depth}`}
      data-light-count={isDepartment ? departmentBudget.lights : venueLayout.performance.lightCount}
      data-lod={lod}
      data-max-furnishings={
        isDepartment
          ? departmentBudget.repeatedFurnishings
          : venueLayout.performance.maxRepeatedFurnishings
      }
      data-max-visible-customers={maxVisibleCustomers}
      data-maximum-p95-frame-time-ms={isDepartment ? frameBudget.maximumP95FrameTimeMs : undefined}
      data-minimum-fps={isDepartment ? frameBudget.minimumFramesPerSecond : undefined}
      data-max-visible-staff={
        isDepartment ? MAX_SCENE_STAFF : venueLayout.performance.maxVisibleStaff
      }
      data-motif-registry={isDepartment ? DEPARTMENT_HERITAGE_MOTIFS.join(',') : undefined}
      data-paused={snapshot.service.isPaused}
      data-performance-settled="false"
      data-queue-capacity={snapshot.service.queueCapacity}
      data-queue-count={snapshot.service.queueCount}
      data-queue-express={snapshot.service.queueSummary.express}
      data-queue-normal={snapshot.service.queueSummary.normal}
      data-queue-overflow={overflow}
      data-reduced-motion={snapshot.presentation.reducedMotion}
      data-renderer="webgl"
      data-render-scale={isDepartment && lod === 'full' ? DEPARTMENT_FULL_RENDER_SCALE : 1}
      data-service-section="scene"
      data-shadow-light-count={
        isDepartment ? departmentBudget.shadowLights : venueLayout.performance.shadowLightCount
      }
      data-shadow-map-size={isDepartment ? departmentBudget.shadowMapSize : SHADOW_MAP_SIZE}
      data-shadow-update-policy="snapshot"
      data-snapshot-id={snapshot.snapshotId}
      data-snapshot-only="true"
      data-speed={snapshot.service.speed}
      data-staff-count={snapshot.service.staff.length}
      data-staff-entity-ids={staffIds}
      data-triangle-budget={isDepartment ? departmentBudget.triangles : 60_000}
      data-upgrade-anchor-registry={
        isDepartment ? DEPARTMENT_PHYSICAL_UPGRADE_REGISTRY.join(',') : undefined
      }
      data-venue={snapshot.identity.venueId}
      data-visible-customers={visibleCustomers}
      data-weather={snapshot.identity.weather}
      data-world={venueLayout.worldName}
    >
      <WebGLBoundary
        sceneLabel={snapshot.description}
        stageAttributes={{
          'data-animation': snapshot.presentation.animate ? 'active' : 'still',
          'data-active-customer': snapshot.service.active?.id ?? 'none',
          'data-last-event': lastActivity?.id ?? 'none',
          'data-lod': lod,
          'data-queue-capacity': snapshot.service.queueCapacity,
          'data-queue-count': snapshot.service.queueCount,
          'data-queue-overflow': overflow,
          'data-snapshot-id': snapshot.snapshotId,
          'data-speed': snapshot.service.speed,
          'data-venue': snapshot.identity.venueId,
          'data-weather': snapshot.identity.weather,
          'data-world': venueLayout.worldName,
        }}
      >
        {({ generation }) => (
          <ServiceCanvas generation={generation} lod={lod} snapshot={snapshot} />
        )}
      </WebGLBoundary>
      <SceneHud
        latestSale={latestSale}
        latestWalkaway={latestWalkaway}
        lowStockCount={lowStock.length}
        overflow={overflow}
        snapshot={snapshot}
      />
      {isDepartment ? <DepartmentBayLabels snapshot={snapshot} /> : null}
      <figcaption>
        {snapshot.description}
        {lastActivity ? ` ${describeRushActivity(lastActivity)}` : ''}
        {lowStock.length > 0
          ? ` Stock warning: ${lowStock.map(({ name }) => name).join(', ')}.`
          : ' Stock is ready.'}
      </figcaption>
    </figure>
  );
}

function ServiceCanvas({
  generation,
  lod,
  snapshot,
}: {
  readonly generation: number;
  readonly lod: DepartmentLod;
  readonly snapshot: RenderSnapshot;
}): React.JSX.Element {
  const isDepartment = snapshot.identity.venueId === 'departmentStore';
  const rawDpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
  const renderScale = isDepartment && lod === 'full' ? DEPARTMENT_FULL_RENDER_SCALE : 1;
  const dpr = isDepartment
    ? boundedDepartmentDevicePixelRatio(rawDpr, lod === 'compact') * renderScale
    : boundedDevicePixelRatio(rawDpr);
  const shadowMapSize = isDepartment
    ? lod === 'compact'
      ? COMPACT_SHADOW_MAP_SIZE
      : SHADOW_MAP_SIZE
    : SHADOW_MAP_SIZE;
  const background =
    snapshot.identity.weather === 'sunny'
      ? CART_PALETTE.skySunny
      : snapshot.identity.weather === 'rainy'
        ? CART_PALETTE.skyRainy
        : snapshot.identity.weather === 'coldSnap'
          ? CART_PALETTE.skyCold
          : CART_PALETTE.skyMild;
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [10, 8, 10], near: 0.1, far: 100 }}
      className="webgl-canvas"
      dpr={dpr}
      frameloop={snapshot.presentation.animate ? 'always' : 'demand'}
      gl={{
        alpha: false,
        // The flagship deliberately uses the existing pixel-crisp presentation instead of
        // expensive MSAA; geometry, DPR, lighting, and shadow detail remain unchanged.
        antialias: !isDepartment,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        stencil: false,
      }}
      key={generation}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.type = BasicShadowMap;
        gl.shadowMap.needsUpdate = true;
        gl.domElement.dataset.renderAuthority = 'snapshot-only';
        gl.domElement.dataset.snapshotId = snapshot.snapshotId;
      }}
      orthographic
      shadows="basic"
      style={{ pointerEvents: 'none' }}
    >
      <color args={[background]} attach="background" />
      <fog args={[background, 11, 31]} attach="fog" />
      <ambientLight intensity={0.9} />
      <directionalLight
        castShadow
        intensity={1.55}
        position={[5, 10, 7]}
        shadow-camera-bottom={-7}
        shadow-camera-far={30}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={7}
        shadow-mapSize-height={shadowMapSize}
        shadow-mapSize-width={shadowMapSize}
      />
      <IsometricCamera lod={lod} venueId={snapshot.identity.venueId} />
      <VenueWorld lod={lod} snapshot={snapshot} />
      <SnapshotShadowMap snapshotId={snapshot.snapshotId} />
      <RendererTelemetry lod={lod} snapshot={snapshot} />
    </Canvas>
  );
}

function SnapshotShadowMap({ snapshotId }: { readonly snapshotId: string }): null {
  const renderedSnapshotId = useRef<string | null>(null);
  useFrame(({ gl }) => {
    if (renderedSnapshotId.current === snapshotId) return;
    // Immutable snapshots are the sole source of scene-transform changes, so one
    // refresh preserves current shadows without repeating the pass every display frame.
    gl.shadowMap.needsUpdate = true;
    renderedSnapshotId.current = snapshotId;
  });
  return null;
}

function VenueWorld({
  lod,
  snapshot,
}: {
  readonly lod: DepartmentLod;
  readonly snapshot: RenderSnapshot;
}): React.JSX.Element {
  switch (snapshot.identity.venueId) {
    case 'cart':
      return <CartWorld snapshot={snapshot} />;
    case 'kiosk':
      return <KioskWorld snapshot={snapshot} />;
    case 'cafe':
      return <CafeWorld snapshot={snapshot} />;
    case 'departmentStore':
      return <DepartmentStoreWorld lod={lod} snapshot={snapshot} />;
    default:
      return assertNever(snapshot.identity.venueId);
  }
}

function IsometricCamera({
  lod,
  venueId,
}: {
  readonly lod: DepartmentLod;
  readonly venueId: RenderSnapshot['identity']['venueId'];
}): null {
  const camera = useThree(({ camera: current }) => current);
  const size = useThree(({ size: current }) => current);
  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    configureServiceCamera(camera, size.width, size.height, venueId, lod === 'compact');
  }, [camera, lod, size.height, size.width, venueId]);
  return null;
}

function RendererTelemetry({
  lod,
  snapshot,
}: {
  readonly lod: DepartmentLod;
  readonly snapshot: RenderSnapshot;
}): null {
  const gl = useThree(({ gl: renderer }) => renderer);
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const frameSample = useRef<FrameSampleState>(createFrameSampleState('initial'));
  const isFrameSamplingEnabled =
    snapshot.identity.venueId === 'departmentStore' && snapshot.presentation.animate;
  const frameSampleKey = `${snapshot.identity.venueId}:${lod}:${String(snapshot.presentation.animate)}`;

  useFrame((_state, deltaSeconds) => {
    if (!isFrameSamplingEnabled) return;
    if (frameSample.current.key !== frameSampleKey) {
      frameSample.current = createFrameSampleState(frameSampleKey);
    }
    const sample = frameSample.current;
    if (sample.warmupFrames < FRAME_WARMUP_COUNT) {
      sample.warmupFrames += 1;
      return;
    }
    if (sample.frameTimesMs.length >= FRAME_SAMPLE_COUNT) return;
    const frameTimeMs = deltaSeconds * 1_000;
    if (!Number.isFinite(frameTimeMs) || frameTimeMs <= 0) return;
    sample.frameTimesMs.push(frameTimeMs);
    if (sample.frameTimesMs.length !== FRAME_SAMPLE_COUNT) return;

    const metrics = frameMetrics(sample.frameTimesMs);
    const budget = DEPARTMENT_FRAME_PERFORMANCE_BUDGET[lod];
    const status =
      metrics.framesPerSecond >= budget.minimumFramesPerSecond &&
      metrics.p95FrameTimeMs <= budget.maximumP95FrameTimeMs
        ? 'pass'
        : 'fail';
    const frame = gl.domElement.closest('figure');
    for (const element of [gl.domElement, frame]) {
      if (!(element instanceof HTMLElement)) continue;
      element.dataset.frameBudgetStatus = status;
      element.dataset.frameSampleStatus = 'complete';
      element.dataset.measuredFps = metrics.framesPerSecond.toFixed(2);
      element.dataset.medianFrameTimeMs = metrics.medianFrameTimeMs.toFixed(2);
      element.dataset.p95FrameTimeMs = metrics.p95FrameTimeMs.toFixed(2);
      element.dataset.sampleDurationMs = metrics.sampleDurationMs.toFixed(2);
    }
  });

  useEffect(() => {
    frameSample.current = createFrameSampleState(frameSampleKey);
    const frame = gl.domElement.closest('figure');
    const frameSampleStatus = isFrameSamplingEnabled ? 'sampling' : 'not-applicable';
    for (const element of [gl.domElement, frame]) {
      if (!(element instanceof HTMLElement)) continue;
      element.dataset.frameBudgetStatus =
        frameSampleStatus === 'sampling' ? 'pending' : 'not-applicable';
      element.dataset.frameSampleStatus = frameSampleStatus;
      delete element.dataset.measuredFps;
      delete element.dataset.medianFrameTimeMs;
      delete element.dataset.p95FrameTimeMs;
      delete element.dataset.sampleDurationMs;
    }
  }, [frameSampleKey, gl, isFrameSamplingEnabled]);

  useEffect(() => {
    invalidate();
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const calls = gl.info.render.calls;
        const triangles = gl.info.render.triangles;
        const frame = gl.domElement.closest('figure');
        const budget = departmentPerformanceBudget(lod);
        const budgetStatus =
          snapshot.identity.venueId !== 'departmentStore' ||
          (calls <= budget.drawCalls && triangles <= budget.triangles)
            ? 'pass'
            : 'fail';
        gl.domElement.dataset.actualDrawCalls = String(calls);
        gl.domElement.dataset.actualTriangles = String(triangles);
        gl.domElement.dataset.lod = lod;
        gl.domElement.dataset.performanceSettled = 'true';
        gl.domElement.dataset.snapshotId = snapshot.snapshotId;
        if (frame instanceof HTMLElement) {
          frame.dataset.actualDrawCalls = String(calls);
          frame.dataset.actualTriangles = String(triangles);
          frame.dataset.budgetStatus = budgetStatus;
          frame.dataset.performanceSettled = 'true';
        }
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [gl, invalidate, lod, snapshot.identity.venueId, snapshot.snapshotId]);
  return null;
}

interface FrameSampleState {
  readonly frameTimesMs: number[];
  readonly key: string;
  warmupFrames: number;
}

interface FrameMetrics {
  readonly framesPerSecond: number;
  readonly medianFrameTimeMs: number;
  readonly p95FrameTimeMs: number;
  readonly sampleDurationMs: number;
}

function createFrameSampleState(key: string): FrameSampleState {
  return { frameTimesMs: [], key, warmupFrames: 0 };
}

function frameMetrics(frameTimesMs: readonly number[]): FrameMetrics {
  const ordered = [...frameTimesMs].sort((left, right) => left - right);
  const sampleDurationMs = frameTimesMs.reduce((total, value) => total + value, 0);
  const medianIndex = Math.floor((ordered.length - 1) / 2);
  const p95Index = Math.ceil(ordered.length * 0.95) - 1;
  return {
    framesPerSecond: (frameTimesMs.length * 1_000) / sampleDurationMs,
    medianFrameTimeMs: ordered[medianIndex] ?? Number.POSITIVE_INFINITY,
    p95FrameTimeMs: ordered[p95Index] ?? Number.POSITIVE_INFINITY,
    sampleDurationMs,
  };
}

function SceneHud({
  latestSale,
  latestWalkaway,
  lowStockCount,
  overflow,
  snapshot,
}: {
  readonly latestSale:
    Extract<RenderSnapshot['service']['activity'][number], { type: 'sale' }> | undefined;
  readonly latestWalkaway:
    Extract<RenderSnapshot['service']['activity'][number], { type: 'walkaway' }> | undefined;
  readonly lowStockCount: number;
  readonly overflow: number;
  readonly snapshot: RenderSnapshot;
}): React.JSX.Element {
  return (
    <div aria-hidden="true" className="scene-hud webgl-scene-hud">
      <strong>QUEUE {snapshot.service.queueCount}</strong>
      <span>
        N {snapshot.service.queueSummary.normal} · X {snapshot.service.queueSummary.express}
      </span>
      {overflow > 0 ? <span className="scene-hud-overflow">+{overflow} beyond view</span> : null}
      {snapshot.service.activeJobs.length > 0 ? (
        <span className="scene-hud-counter">
          MAKING {snapshot.service.activeJobs.length} ·{' '}
          {snapshot.service.activeJobs.map(({ progress }) => Math.round(progress * 100)).join('/')}%
        </span>
      ) : null}
      {latestSale ? (
        <span className="scene-hud-sale">SALE +{formatMoney(latestSale.priceCents)}</span>
      ) : null}
      {latestWalkaway ? (
        <span className="scene-hud-walkaway">{walkawayLabel(latestWalkaway.reason)}</span>
      ) : null}
      <span className="webgl-stock-signal">
        STOCK {lowStockCount === 0 ? 'READY' : `${lowStockCount} LOW/EMPTY`}
      </span>
    </div>
  );
}

function DepartmentBayLabels({
  snapshot,
}: {
  readonly snapshot: RenderSnapshot;
}): React.JSX.Element {
  return (
    <div aria-hidden="true" className="department-bay-labels">
      {Object.values(DEPARTMENT_LAYOUT.stations).map((station) => {
        const job = snapshot.service.activeJobs.find(({ stationId }) => station.id === stationId);
        return (
          <span data-bay-id={station.id} key={station.id}>
            {station.label} · {job ? `${job.laneId === 'express' ? 'X' : 'N'} active` : 'ready'}
          </span>
        );
      })}
    </div>
  );
}

function useCompactViewport(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
        return () => undefined;
      const media = window.matchMedia(COMPACT_SCENE_QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () =>
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(COMPACT_SCENE_QUERY).matches
        : false,
    () => false,
  );
}

function walkawayLabel(reason: string): string {
  if (reason === 'stockout') return 'OUT OF STOCK';
  if (reason === 'queueFull') return 'QUEUE FULL';
  if (reason === 'rushEnded') return 'RUSH CLOSED';
  return 'WAITED TOO LONG';
}

function assertNever(value: never): never {
  throw new Error(`Unsupported service venue: ${String(value)}`);
}
