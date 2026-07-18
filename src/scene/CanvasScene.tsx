import { useEffect, useMemo, useRef } from 'react';

import { useGame } from '../app/GameContext';
import type { CustomerSegment, EquipmentState, StaffRole, WeatherId } from '../game';
import {
  LOGICAL_SCENE_SIZE,
  createSceneSnapshot,
  describeScene,
  shouldAnimateScene,
  type SceneSnapshot,
} from './sceneModel';

const { width: WIDTH, height: HEIGHT } = LOGICAL_SCENE_SIZE;

/** Snapshot-driven, fixed-resolution pixel scene with accessible textual parity. */
export function CanvasScene(): React.JSX.Element {
  const { game, meta, preferences } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    drawScene(context, snapshot, 0);
    if (!shouldAnimateScene(snapshot)) return undefined;
    let frameId = 0;
    const draw = (time: number): void => {
      drawScene(context, snapshot, Math.floor(time / 180));
      frameId = window.requestAnimationFrame(draw);
    };
    frameId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frameId);
  }, [snapshot]);

  const description = snapshot ? describeScene(snapshot) : 'Side-on coffee business scene.';
  return (
    <figure className="scene-frame">
      <canvas
        aria-label={description}
        data-animation={snapshot && shouldAnimateScene(snapshot) ? 'active' : 'still'}
        data-venue={snapshot?.venueId}
        data-weather={snapshot?.weather}
        height={HEIGHT}
        ref={canvasRef}
        role="img"
        width={WIDTH}
      />
      <figcaption>{description}</figcaption>
    </figure>
  );
}

function drawScene(
  context: CanvasRenderingContext2D,
  snapshot: SceneSnapshot,
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
  drawQueue(context, snapshot.queueSegments, frame);
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
  segments: readonly CustomerSegment[],
  frame: number,
): void {
  const shirts: Record<CustomerSegment, string> = {
    commuter: '#417b78',
    student: '#c86b4a',
    enthusiast: '#7f6aa2',
    regular: '#d79b38',
  };
  segments.forEach((segment, index) => {
    const x = 226 + index * 15;
    const bob = (frame + index) % 2;
    context.fillStyle = index % 2 === 0 ? '#d8a67d' : '#8f5f43';
    context.fillRect(x, 116 + bob, 7, 7);
    context.fillStyle = shirts[segment];
    context.fillRect(x - 1, 123 + bob, 9, 13);
    context.fillStyle = '#29201b';
    context.fillRect(x, 136, 3, 9);
    context.fillRect(x + 5, 136, 3, 9);
  });
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
