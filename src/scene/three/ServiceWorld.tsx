import { useLayoutEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { BasicShadowMap, OrthographicCamera } from 'three';

import { useGame } from '../../app/GameContext';
import { describeRushActivity, formatMoney } from '../../game';
import { configureIsometricCamera } from './camera';
import {
  boundedDevicePixelRatio,
  CART_PALETTE,
  MAX_DEVICE_PIXEL_RATIO,
  SHADOW_MAP_SIZE,
} from './materials';
import { createRenderSnapshot, MAX_RENDER_QUEUE_CUSTOMERS } from './renderSnapshot';
import { CartWorld } from './venues/CartWorld';
import { WebGLBoundary } from './WebGLBoundary';

/** Lazy, snapshot-only WebGL service renderer for the cart venue. */
export function ServiceWorld(): React.JSX.Element | null {
  const { game, meta, preferences } = useGame();
  const snapshot = useMemo(
    () =>
      game && game.venueId === 'cart' && (game.phase === 'rush' || game.phase === 'event')
        ? createRenderSnapshot(game, preferences.reducedMotion, meta.cosmetics)
        : null,
    [game, meta.cosmetics, preferences.reducedMotion],
  );
  if (!snapshot) return null;

  const overflow = Math.max(0, snapshot.service.queueCount - MAX_RENDER_QUEUE_CUSTOMERS);
  const latestSale = snapshot.service.activity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot.service.activity.findLast((event) => event.type === 'walkaway');
  const lastActivity = snapshot.service.activity.at(-1);
  const lowStock = snapshot.operation.stock.filter(({ level }) => level !== 'available');
  const equipmentLabel = Object.entries(snapshot.operation.equipment)
    .filter(([, level]) => level > 0)
    .map(([equipment, level]) => `${equipment}:${level}`)
    .join(',');

  return (
    <figure
      className="scene-frame webgl-service-world"
      data-animation={snapshot.presentation.animate ? 'active' : 'still'}
      data-camera="orthographic-isometric"
      data-dpr-max={MAX_DEVICE_PIXEL_RATIO}
      data-equipment={equipmentLabel}
      data-active-customer={snapshot.service.active?.id ?? 'none'}
      data-instanced-people="true"
      data-last-event={lastActivity?.id ?? 'none'}
      data-paused={snapshot.service.isPaused}
      data-queue-count={snapshot.service.queueCount}
      data-queue-overflow={overflow}
      data-reduced-motion={snapshot.presentation.reducedMotion}
      data-renderer="webgl"
      data-snapshot-only="true"
      data-speed={snapshot.service.speed}
      data-venue={snapshot.identity.venueId}
      data-weather={snapshot.identity.weather}
    >
      <WebGLBoundary
        sceneLabel={snapshot.description}
        stageAttributes={{
          'data-animation': snapshot.presentation.animate ? 'active' : 'still',
          'data-active-customer': snapshot.service.active?.id ?? 'none',
          'data-last-event': lastActivity?.id ?? 'none',
          'data-queue-count': snapshot.service.queueCount,
          'data-queue-overflow': overflow,
          'data-speed': snapshot.service.speed,
          'data-venue': snapshot.identity.venueId,
          'data-weather': snapshot.identity.weather,
        }}
      >
        {({ generation }) => <CartCanvas generation={generation} snapshot={snapshot} />}
      </WebGLBoundary>
      <div aria-hidden="true" className="scene-hud webgl-scene-hud">
        <strong>QUEUE {snapshot.service.queueCount}</strong>
        {overflow > 0 ? <span className="scene-hud-overflow">+{overflow} beyond view</span> : null}
        {snapshot.service.active ? (
          <span className="scene-hud-counter">
            COUNTER · {snapshot.service.active.segment} ·{' '}
            {Math.round(snapshot.service.active.progress * 100)}%
          </span>
        ) : null}
        {latestSale ? (
          <span className="scene-hud-sale">SALE +{formatMoney(latestSale.priceCents)}</span>
        ) : null}
        {latestWalkaway ? (
          <span className="scene-hud-walkaway">{walkawayLabel(latestWalkaway.reason)}</span>
        ) : null}
        <span className="webgl-stock-signal">
          STOCK {lowStock.length === 0 ? 'READY' : `${lowStock.length} LOW/EMPTY`}
        </span>
      </div>
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

function CartCanvas({
  generation,
  snapshot,
}: {
  readonly generation: number;
  readonly snapshot: ReturnType<typeof createRenderSnapshot>;
}): React.JSX.Element {
  const dpr = boundedDevicePixelRatio(typeof window === 'undefined' ? 1 : window.devicePixelRatio);
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
        antialias: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        stencil: false,
      }}
      key={generation}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = BasicShadowMap;
        gl.domElement.dataset.renderAuthority = 'snapshot-only';
      }}
      orthographic
      shadows="basic"
      style={{ pointerEvents: 'none' }}
    >
      <color args={[background]} attach="background" />
      <fog args={[background, 10, 28]} attach="fog" />
      <ambientLight intensity={0.9} />
      <directionalLight
        castShadow
        intensity={1.55}
        position={[5, 10, 7]}
        shadow-camera-bottom={-7}
        shadow-camera-far={30}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={7}
        shadow-mapSize-height={SHADOW_MAP_SIZE}
        shadow-mapSize-width={SHADOW_MAP_SIZE}
      />
      <IsometricCamera />
      <CartWorld snapshot={snapshot} />
    </Canvas>
  );
}

function IsometricCamera(): null {
  const camera = useThree(({ camera: current }) => current);
  const size = useThree(({ size: current }) => current);
  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    configureIsometricCamera(camera, size.width, size.height);
  }, [camera, size.height, size.width]);
  return null;
}

function walkawayLabel(reason: string): string {
  if (reason === 'stockout') return 'OUT OF STOCK';
  if (reason === 'queueFull') return 'QUEUE FULL';
  if (reason === 'rushEnded') return 'RUSH CLOSED';
  return 'WAITED TOO LONG';
}
