import { useEffect, useMemo, useRef } from 'react';

import { useGame } from '../app/GameContext';
import {
  formatMoney,
  type CustomerSegment,
  type EquipmentState,
  type RushWalkawayReason,
  type StaffRole,
  type WeatherId,
} from '../game';
import {
  LOGICAL_SCENE_SIZE,
  createSceneSnapshot,
  describeScene,
  shouldAnimateScene,
  type SceneSnapshot,
} from './sceneModel';
import {
  advanceScenePlayback,
  createScenePlayback,
  interpolatedQueueIndex,
  sceneTransientProgress,
  syncScenePlayback,
  walkawayVisualLabel,
  type ScenePlaybackState,
  type SceneTransient,
} from './scenePlayback';

const { width: WIDTH, height: HEIGHT } = LOGICAL_SCENE_SIZE;

/** Snapshot-driven, fixed-resolution pixel scene with accessible textual parity. */
export function CanvasScene(): React.JSX.Element {
  const { game, meta, preferences } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playbackRef = useRef<ScenePlaybackState | null>(null);
  const snapshot = useMemo(
    () => (game ? createSceneSnapshot(game, preferences.reducedMotion, meta.cosmetics) : null),
    [game, meta.cosmetics, preferences.reducedMotion],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.imageSmoothingEnabled = false;
    playbackRef.current = playbackRef.current
      ? syncScenePlayback(playbackRef.current, snapshot)
      : createScenePlayback(snapshot);
    drawScene(context, snapshot, playbackRef.current, snapshot.rushTick);
    const closingPlayback =
      snapshot.phase === 'report' &&
      !snapshot.reducedMotion &&
      !snapshot.isPaused &&
      playbackRef.current.transients.length > 0;
    canvas.dataset.transientCount = String(playbackRef.current.transients.length);
    canvas.dataset.animation = shouldAnimateScene(snapshot) || closingPlayback ? 'active' : 'still';
    if (!shouldAnimateScene(snapshot) && !closingPlayback) return undefined;
    let frameId = 0;
    let previousTime: number | null = null;
    const draw = (time: number): void => {
      const elapsed = previousTime === null ? 0 : time - previousTime;
      previousTime = time;
      playbackRef.current = advanceScenePlayback(
        playbackRef.current ?? createScenePlayback(snapshot),
        snapshot,
        elapsed,
      );
      drawScene(context, snapshot, playbackRef.current, Math.floor(time / 180));
      const continueDrawing =
        shouldAnimateScene(snapshot) ||
        (snapshot.phase === 'report' && playbackRef.current.transients.length > 0);
      canvas.dataset.transientCount = String(playbackRef.current.transients.length);
      canvas.dataset.animation = continueDrawing ? 'active' : 'still';
      if (continueDrawing) frameId = window.requestAnimationFrame(draw);
    };
    frameId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frameId);
  }, [snapshot]);

  const description = snapshot ? describeScene(snapshot) : 'Side-on coffee business scene.';
  const latestSale = snapshot?.recentActivity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot?.recentActivity.findLast((event) => event.type === 'walkaway');
  const overflow = Math.max(0, (snapshot?.queueCount ?? 0) - 8);
  return (
    <figure
      className="scene-frame"
      data-paused={snapshot?.isPaused ?? false}
      data-reduced-motion={snapshot?.reducedMotion ?? false}
    >
      <canvas
        aria-label={description}
        data-animation={snapshot && shouldAnimateScene(snapshot) ? 'active' : 'still'}
        data-active-customer={snapshot?.activeCustomer?.id ?? 'none'}
        data-last-event={snapshot?.recentActivity.at(-1)?.id ?? 'none'}
        data-queue-count={snapshot?.queueCount ?? 0}
        data-queue-overflow={overflow}
        data-speed={snapshot?.rushSpeed ?? 1}
        data-transient-count={0}
        data-venue={snapshot?.venueId}
        data-weather={snapshot?.weather}
        height={HEIGHT}
        ref={canvasRef}
        role="img"
        width={WIDTH}
      />
      {snapshot ? (
        <div aria-hidden="true" className="scene-hud">
          <strong>QUEUE {snapshot.queueCount}</strong>
          {overflow > 0 ? (
            <span className="scene-hud-overflow">+{overflow} beyond view</span>
          ) : null}
          {snapshot.activeCustomer ? (
            <span className="scene-hud-counter">COUNTER · {snapshot.activeCustomer.segment}</span>
          ) : null}
          {latestSale ? (
            <span className="scene-hud-sale">SALE +{formatMoney(latestSale.priceCents)}</span>
          ) : null}
          {latestWalkaway ? (
            <span className="scene-hud-walkaway">{walkawayVisualLabel(latestWalkaway.reason)}</span>
          ) : null}
        </div>
      ) : null}
      <figcaption>{description}</figcaption>
    </figure>
  );
}

function drawScene(
  context: CanvasRenderingContext2D,
  snapshot: SceneSnapshot,
  playback: ScenePlaybackState,
  frame: number,
): void {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground(context, snapshot.weather, frame);
  if (snapshot.venueId === 'cart') drawCart(context, snapshot);
  else if (snapshot.venueId === 'kiosk') drawKiosk(context, snapshot);
  else drawCafe(context, snapshot);
  drawEquipment(context, snapshot.equipment, snapshot.venueId);
  drawWorker(context, 153, 83, 'barista', snapshot.isServing, frame);
  snapshot.scheduledRoles
    .slice(0, 4)
    .forEach((role, index) =>
      drawWorker(context, 117 + index * 19, 112, role, snapshot.isServing, frame + index),
    );
  drawQueue(context, snapshot, playback, frame);
  if (snapshot.activeCustomer) {
    drawCustomer(
      context,
      snapshot.activeCustomer.id,
      snapshot.activeCustomer.segment,
      210,
      113,
      frame,
      false,
    );
    drawCounterHandoff(context, snapshot, frame);
  }
  drawTransients(context, playback, frame);
  drawQueueStatus(context, snapshot.queueCount);
  drawPersistedEvidence(context, snapshot);
  if (snapshot.phase === 'report' || snapshot.phase === 'reinvest') drawClosingGlow(context);
  drawWeather(context, snapshot.weather, frame);
}

function drawBackground(
  context: CanvasRenderingContext2D,
  weather: WeatherId,
  frame: number,
): void {
  context.fillStyle =
    weather === 'sunny' ? '#d7c17a' : weather === 'coldSnap' ? '#89a8ad' : '#91b6b3';
  context.fillRect(0, 0, WIDTH, 70);
  if (weather === 'sunny') {
    context.fillStyle = '#f2c14e';
    context.fillRect(276, 14, 18, 18);
    context.fillStyle = '#fff0bd';
    context.fillRect(280, 18, 10, 10);
  } else {
    context.fillStyle = weather === 'rainy' ? '#647f82' : '#d7e0d6';
    context.fillRect(18 + (frame % 2) * 2, 17, 54, 8);
    context.fillRect(207, 28, 66, 7);
  }
  context.fillStyle = '#b55b3d';
  context.fillRect(0, 70, WIDTH, 78);
  context.fillStyle = '#8f452f';
  for (let y = 74; y < 146; y += 10) {
    for (let x = (y / 10) % 2 === 0 ? 0 : 8; x < WIDTH; x += 16) {
      context.fillRect(x, y, 14, 7);
    }
  }
  context.fillStyle = '#4b3c35';
  context.fillRect(0, 148, WIDTH, 32);
  context.fillStyle = weather === 'rainy' ? '#8aa0a0' : '#78665b';
  for (let x = 0; x < WIDTH; x += 32) context.fillRect(x, 151, 28, 2);
  context.fillStyle = '#f2c14e';
  context.fillRect(24, 20, 72, 29);
  context.fillStyle = '#34241d';
  context.font = 'bold 9px monospace';
  context.fillText('BEANS THIS WAY', 29, 37);
}

function drawCart(context: CanvasRenderingContext2D, snapshot: SceneSnapshot): void {
  drawAwning(context, 106, 68, 104, snapshot.awning);
  context.fillStyle = '#f0a45d';
  context.fillRect(111, 80, 94, 57);
  context.fillStyle = '#f7ddaa';
  context.fillRect(118, 90, 80, 31);
  context.fillStyle = '#4d3024';
  context.fillRect(120, 94, 76, 23);
  context.fillStyle = '#85a978';
  context.fillRect(132, 97, 52, 17);
  context.fillStyle = '#2f2118';
  context.font = 'bold 9px monospace';
  context.fillText('LANEWAY', 137, 108);
  context.fillStyle = '#211915';
  context.fillRect(124, 136, 16, 10);
  context.fillRect(177, 136, 16, 10);
  context.fillStyle = '#6b5245';
  context.fillRect(108, 137, 100, 5);
  if (snapshot.hasStreetSign) drawStreetSign(context);
}

function drawKiosk(context: CanvasRenderingContext2D, snapshot: SceneSnapshot): void {
  context.fillStyle = '#2f2118';
  context.fillRect(82, 48, 150, 98);
  context.fillStyle = '#e7b65b';
  context.fillRect(88, 56, 138, 78);
  drawAwning(context, 91, 58, 132, snapshot.awning);
  context.fillStyle = '#f7ddaa';
  context.fillRect(100, 76, 114, 35);
  context.fillStyle = '#4d3024';
  context.fillRect(105, 80, 104, 26);
  context.fillStyle = '#85a978';
  context.fillRect(118, 84, 77, 18);
  context.fillStyle = '#2f2118';
  context.font = 'bold 10px monospace';
  context.fillText('LANEWAY KIOSK', 113, 96);
  context.fillStyle = '#6b5245';
  context.fillRect(84, 134, 146, 9);
}

function drawCafe(context: CanvasRenderingContext2D, snapshot: SceneSnapshot): void {
  context.fillStyle = '#30231d';
  context.fillRect(35, 29, 229, 119);
  context.fillStyle = '#e9c679';
  context.fillRect(42, 37, 215, 103);
  context.fillStyle = '#8f452f';
  context.fillRect(42, 37, 215, 20);
  drawAwning(context, 52, 58, 195, snapshot.awning);
  context.fillStyle = '#f7ddaa';
  context.fillRect(61, 75, 72, 45);
  context.fillRect(158, 75, 79, 45);
  context.fillStyle = '#536f72';
  context.fillRect(66, 80, 62, 35);
  context.fillRect(163, 80, 69, 35);
  context.fillStyle = '#2f2118';
  context.font = 'bold 11px monospace';
  context.fillText('LANEWAY SPECIALTY', 77, 51);
  context.fillStyle = '#6b5245';
  context.fillRect(37, 140, 225, 7);
  context.fillStyle = '#6d9270';
  context.fillRect(45, 121, 11, 20);
  context.fillRect(241, 119, 10, 22);
}

function drawAwning(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  cosmetic: SceneSnapshot['awning'],
): void {
  const palette: readonly [string, string] =
    cosmetic === 'neonCup'
      ? ['#4f3a67', '#e87889']
      : cosmetic === 'wattleAwning'
        ? ['#315e54', '#e8aa3c']
        : ['#315e54', '#f7ddaa'];
  context.fillStyle = '#2f2118';
  context.fillRect(x, y, width, 12);
  for (let stripe = 0; stripe < Math.ceil(width / 12); stripe += 1) {
    context.fillStyle = stripe % 2 === 0 ? palette[0] : palette[1];
    context.fillRect(x + stripe * 12 + 2, y + 2, Math.min(10, width - stripe * 12 - 2), 8);
  }
}

function drawEquipment(
  context: CanvasRenderingContext2D,
  equipment: Readonly<EquipmentState>,
  venue: SceneSnapshot['venueId'],
): void {
  const baseY = venue === 'cafe' ? 103 : 112;
  if (equipment.espressoMachine > 0) {
    context.fillStyle = equipment.espressoMachine === 2 ? '#b9c7c6' : '#829a98';
    context.fillRect(174, baseY - 17, 20, 13);
    context.fillStyle = '#e8aa3c';
    context.fillRect(178, baseY - 14, 3, 3);
  }
  if (equipment.grinder > 0) {
    context.fillStyle = '#3d4d4b';
    context.fillRect(164, baseY - 14, 7, 10);
    context.fillStyle = '#a9c7b9';
    context.fillRect(165, baseY - 20, 5, 6);
  }
  if (equipment.pos > 0) {
    context.fillStyle = '#2f3134';
    context.fillRect(198, baseY - 16, 8, 12);
    context.fillStyle = '#72b6ad';
    context.fillRect(199, baseY - 14, 6, 5);
  }
  if (equipment.refrigeration > 0 && venue !== 'cart') {
    context.fillStyle = '#b4c5c5';
    context.fillRect(93, 109, 15, 28);
    context.fillStyle = '#536f72';
    context.fillRect(104, 113, 2, 3);
  }
}

function drawWorker(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  role: StaffRole,
  isWorking: boolean,
  frame: number,
): void {
  const bob = isWorking ? frame % 2 : 0;
  context.fillStyle = role === 'barista' ? '#d19a72' : '#8f5f43';
  context.fillRect(x + 2, y + bob, 9, 9);
  context.fillStyle = role === 'barista' ? '#352820' : '#e8aa3c';
  context.fillRect(x, y - 2 + bob, 13, 4);
  context.fillStyle = role === 'barista' ? '#5d7982' : '#3f7667';
  context.fillRect(x, y + 9 + bob, 13, 17);
  if (isWorking && role === 'barista') {
    context.fillStyle = '#e8e0cd';
    context.fillRect(x + 15, y + 13 + bob, 6, 7);
    context.fillRect(x + 17 + (frame % 2), y + 7, 1, 4);
  }
}

function drawQueue(
  context: CanvasRenderingContext2D,
  snapshot: SceneSnapshot,
  playback: ScenePlaybackState,
  frame: number,
): void {
  const arriving = new Set(
    playback.transients
      .filter((transient) => transient.kind === 'arrival')
      .map(({ customerId }) => customerId),
  );
  playback.queueMotions.forEach((motion, index) => {
    if (arriving.has(motion.customerId)) return;
    drawCustomer(
      context,
      motion.customerId,
      motion.segment,
      queueX(interpolatedQueueIndex(motion)),
      116,
      frame + index,
      false,
    );
  });
  const overflow = snapshot.queueCount - snapshot.queueCustomers.length;
  if (overflow > 0) {
    context.fillStyle = '#f7d98e';
    context.fillRect(286, 101, 29, 12);
    context.fillStyle = '#2f2118';
    context.font = 'bold 8px monospace';
    context.fillText(`+${overflow}`, 294, 110);
  }
}

function drawCustomer(
  context: CanvasRenderingContext2D,
  customerId: string,
  segment: CustomerSegment | null,
  x: number,
  y: number,
  frame: number,
  carryingCup: boolean,
): void {
  const visualSegment = segment ?? 'regular';
  const shirts: Record<CustomerSegment, string> = {
    commuter: '#2f7774',
    student: '#c85f42',
    enthusiast: '#7661a2',
    regular: '#d49227',
  };
  const skinTones = ['#f0c39f', '#d99a70', '#a96f4f', '#704834'] as const;
  const hash = hashCustomer(customerId);
  const bob = frame % 2;
  context.fillStyle = skinTones[hash % skinTones.length] ?? skinTones[0];
  context.fillRect(x + 2, y + bob, 7, 7);
  context.fillStyle = hash % 3 === 0 ? '#2b211c' : hash % 3 === 1 ? '#70452d' : '#d0a15e';
  context.fillRect(x + 1, y - 2 + bob, 9, 3);
  context.fillStyle = shirts[visualSegment];
  context.fillRect(x, y + 7 + bob, 10, 14);
  context.fillStyle = '#29201b';
  context.fillRect(x + 1, y + 21, 3, 9);
  context.fillRect(x + 6, y + 21, 3, 9);
  drawSegmentDetail(context, visualSegment, x, y + bob);
  if (carryingCup) drawCup(context, x + 11, y + 11 + bob);
}

function drawSegmentDetail(
  context: CanvasRenderingContext2D,
  segment: CustomerSegment,
  x: number,
  y: number,
): void {
  if (segment === 'commuter') {
    context.fillStyle = '#2f2118';
    context.fillRect(x + 9, y + 13, 4, 6);
    context.fillRect(x + 10, y + 11, 2, 2);
  } else if (segment === 'student') {
    context.fillStyle = '#e8aa3c';
    context.fillRect(x - 3, y + 9, 4, 10);
  } else if (segment === 'enthusiast') {
    context.fillStyle = '#f7ddaa';
    context.fillRect(x - 1, y + 8, 12, 3);
    context.fillRect(x + 8, y + 11, 2, 4);
  } else {
    context.fillStyle = '#315e54';
    context.fillRect(x, y - 3, 10, 2);
    context.fillRect(x + 8, y - 1, 4, 2);
  }
}

function drawCounterHandoff(
  context: CanvasRenderingContext2D,
  snapshot: SceneSnapshot,
  frame: number,
): void {
  const pulse = frame % 2;
  drawCup(context, 204 + pulse, 119);
  context.fillStyle = '#f7ddaa';
  context.fillRect(201, 126, 17, 2);
  context.fillStyle = '#2f2118';
  context.font = 'bold 6px monospace';
  context.fillText(snapshot.activeCustomer?.order.size === 'large' ? 'L CUP' : 'CUP', 199, 111);
}

function drawTransients(
  context: CanvasRenderingContext2D,
  playback: ScenePlaybackState,
  frame: number,
): void {
  playback.transients.forEach((transient, index) => {
    const progress = sceneTransientProgress(transient);
    if (transient.kind === 'arrival') {
      const target = playback.queueMotions.find(
        (motion) => motion.customerId === transient.customerId,
      );
      const targetX = target ? queueX(target.toIndex) : 300;
      const x = 317 + (targetX - 317) * progress;
      drawCustomer(context, transient.customerId, transient.segment, x, 116, frame + index, false);
      drawTransientLabel(context, 'ARRIVING', Math.max(238, x - 8), 105 - index * 10, '#d8e7d2');
    } else if (transient.kind === 'sale') {
      const x = 210 - progress * 172;
      drawCustomer(context, transient.customerId, transient.segment, x, 113, frame + index, true);
      drawTransientLabel(
        context,
        `+${formatMoney(transient.priceCents ?? 0)}`,
        Math.max(8, 188 - progress * 82),
        95 - progress * 13,
        '#d8e7d2',
      );
      drawTransientLabel(context, 'SERVED · COFFEE', Math.max(7, x - 5), 145, '#d8e7d2');
    } else {
      drawWalkawayTransient(context, transient, progress, frame + index);
    }
  });
}

function drawWalkawayTransient(
  context: CanvasRenderingContext2D,
  transient: SceneTransient,
  progress: number,
  frame: number,
): void {
  const reason = transient.reason ?? 'rushEnded';
  const startX = reason === 'queueFull' ? 296 : reason === 'stockout' ? 215 : 252;
  const x = startX + progress * (322 - startX);
  const y = reason === 'rushEnded' ? 116 + progress * 11 : 116;
  drawCustomer(context, transient.customerId, transient.segment, x, y, frame, false);
  drawWalkawayIcon(context, reason, Math.min(299, x - 9), y - 12);
  drawTransientLabel(
    context,
    walkawayVisualLabel(reason),
    reason === 'queueFull' ? 235 : 205,
    93 - (transient.sequence % 2) * 10,
    '#f7d2bd',
  );
}

function drawWalkawayIcon(
  context: CanvasRenderingContext2D,
  reason: RushWalkawayReason,
  x: number,
  y: number,
): void {
  context.fillStyle = '#2f2118';
  context.fillRect(x, y, 10, 10);
  context.fillStyle = reason === 'patience' ? '#f2c14e' : '#f7ddaa';
  if (reason === 'patience') {
    context.fillRect(x + 2, y + 2, 6, 6);
    context.fillStyle = '#2f2118';
    context.fillRect(x + 5, y + 3, 1, 3);
    context.fillRect(x + 5, y + 5, 2, 1);
  } else if (reason === 'queueFull') {
    context.fillRect(x + 2, y + 2, 6, 2);
    context.fillRect(x + 2, y + 6, 6, 2);
  } else if (reason === 'stockout') {
    context.fillRect(x + 2, y + 2, 5, 5);
    context.fillStyle = '#b54f3b';
    context.fillRect(x + 1, y + 5, 8, 2);
  } else {
    context.fillRect(x + 2, y + 2, 6, 6);
    context.fillStyle = '#b54f3b';
    context.fillRect(x + 4, y + 1, 2, 8);
  }
}

function drawQueueStatus(context: CanvasRenderingContext2D, queueCount: number): void {
  context.fillStyle = '#2f2118';
  context.fillRect(236, 12, 78, 15);
  context.fillStyle = '#f7d98e';
  context.font = 'bold 9px monospace';
  context.fillText(`QUEUE ${queueCount}`, 245, 23);
}

function drawPersistedEvidence(context: CanvasRenderingContext2D, snapshot: SceneSnapshot): void {
  const sale = snapshot.recentActivity.findLast((event) => event.type === 'sale');
  const walkaway = snapshot.recentActivity.findLast((event) => event.type === 'walkaway');
  if (sale) {
    drawTransientLabel(context, `SALE +${formatMoney(sale.priceCents)}`, 6, 160, '#d8e7d2');
  }
  if (walkaway) {
    drawTransientLabel(context, walkawayVisualLabel(walkaway.reason), 113, 160, '#f7d2bd');
  }
}

function drawTransientLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  background: string,
): void {
  const width = Math.min(105, Math.max(28, label.length * 5 + 6));
  context.fillStyle = '#2f2118';
  context.fillRect(x - 1, y - 9, width + 2, 12);
  context.fillStyle = background;
  context.fillRect(x, y - 8, width, 10);
  context.fillStyle = '#2f2118';
  context.font = 'bold 6px monospace';
  context.fillText(label, x + 3, y - 1);
}

function drawCup(context: CanvasRenderingContext2D, x: number, y: number): void {
  context.fillStyle = '#f5ead2';
  context.fillRect(x, y, 5, 6);
  context.fillStyle = '#315e54';
  context.fillRect(x + 1, y + 1, 3, 2);
  context.fillStyle = '#2f2118';
  context.fillRect(x + 5, y + 2, 2, 3);
}

function queueX(index: number): number {
  return 226 + index * 11;
}

function hashCustomer(customerId: string): number {
  let hash = 0;
  for (let index = 0; index < customerId.length; index += 1) {
    hash = (Math.imul(hash, 31) + (customerId.codePointAt(index) ?? 0)) >>> 0;
  }
  return hash;
}

function drawWeather(context: CanvasRenderingContext2D, weather: WeatherId, frame: number): void {
  if (weather === 'rainy') {
    context.fillStyle = '#b6d7d6';
    for (let index = 0; index < 22; index += 1) {
      const x = (index * 29 + frame * 3) % WIDTH;
      const y = (index * 17 + frame * 5) % 145;
      context.fillRect(x, y, 1, 5);
    }
  }
  if (weather === 'coldSnap') {
    context.fillStyle = '#e7eeee';
    context.fillRect(173 + (frame % 3), 83 - (frame % 3), 2, 5);
    context.fillRect(179 + ((frame + 1) % 3), 78 - (frame % 2), 2, 4);
  }
}

function drawStreetSign(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#f2c14e';
  context.fillRect(75, 110, 24, 30);
  context.fillStyle = '#2f2118';
  context.fillRect(86, 140, 3, 10);
  context.font = 'bold 6px monospace';
  context.fillText('GOOD', 79, 121);
  context.fillText('COFFEE', 76, 130);
}

function drawClosingGlow(context: CanvasRenderingContext2D): void {
  context.fillStyle = 'rgba(242, 193, 78, 0.16)';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = '#f7ddaa';
  context.font = 'bold 9px monospace';
  context.fillText('LAST CUPS DONE', 219, 24);
}
