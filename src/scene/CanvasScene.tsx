import { useEffect, useRef } from 'react';

import { useGame } from '../app/GameContext';
import { VENUES } from '../content/gameContent';

const WIDTH = 320;
const HEIGHT = 180;

/** Snapshot-driven, fixed-resolution side-on cart scene. */
export function CanvasScene(): React.JSX.Element {
  const { game } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !game) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.imageSmoothingEnabled = false;
    let frameId = 0;
    const draw = (time: number): void => {
      drawScene(context, game, time);
      frameId = window.requestAnimationFrame(draw);
    };
    frameId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frameId);
  }, [game]);

  const queueLength = game?.rush?.queue.length ?? 0;
  const description = game
    ? `Side-on ${VENUES[game.venueId].shortName} scene. Day ${game.day}, ${game.phase} phase, ${queueLength} customers waiting.`
    : 'Side-on coffee business scene.';

  return (
    <figure className="scene-frame">
      <canvas aria-label={description} height={HEIGHT} ref={canvasRef} role="img" width={WIDTH} />
      <figcaption>{description}</figcaption>
    </figure>
  );
}

function drawScene(
  context: CanvasRenderingContext2D,
  game: NonNullable<ReturnType<typeof useGame>['game']>,
  time: number,
): void {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground(context);
  if (game.venueId === 'cart') drawCart(context, game.improvements.includes('street-sign'));
  else if (game.venueId === 'kiosk') drawKiosk(context);
  else drawCafe(context);
  drawBarista(
    context,
    game.rush?.activeService !== null && game.rush?.activeService !== undefined,
    time,
  );
  drawQueue(context, game.rush?.queue.length ?? 0, time);
  if (game.phase === 'report' || game.phase === 'reinvest') drawClosingGlow(context);
}

function drawBackground(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#91b6b3';
  context.fillRect(0, 0, WIDTH, 70);
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
  context.fillStyle = '#78665b';
  for (let x = 0; x < WIDTH; x += 32) context.fillRect(x, 151, 28, 2);
  context.fillStyle = '#f2c14e';
  context.fillRect(24, 20, 72, 29);
  context.fillStyle = '#34241d';
  context.font = 'bold 9px monospace';
  context.fillText('BEANS THIS WAY', 29, 37);
}

function drawCart(context: CanvasRenderingContext2D, hasSign: boolean): void {
  context.fillStyle = '#2f2118';
  context.fillRect(106, 71, 104, 9);
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
  if (hasSign) {
    context.fillStyle = '#f2c14e';
    context.fillRect(75, 110, 24, 30);
    context.fillStyle = '#2f2118';
    context.fillRect(86, 140, 3, 10);
    context.font = 'bold 6px monospace';
    context.fillText('GOOD', 79, 121);
    context.fillText('COFFEE', 76, 130);
  }
}

function drawKiosk(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#2f2118';
  context.fillRect(82, 48, 150, 98);
  context.fillStyle = '#e7b65b';
  context.fillRect(88, 56, 138, 78);
  context.fillStyle = '#f7ddaa';
  context.fillRect(100, 69, 114, 42);
  context.fillStyle = '#4d3024';
  context.fillRect(105, 75, 104, 31);
  context.fillStyle = '#85a978';
  context.fillRect(118, 82, 77, 18);
  context.fillStyle = '#2f2118';
  context.font = 'bold 10px monospace';
  context.fillText('LANEWAY KIOSK', 113, 94);
  context.fillStyle = '#6b5245';
  context.fillRect(84, 134, 146, 9);
}

function drawCafe(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#30231d';
  context.fillRect(35, 29, 229, 119);
  context.fillStyle = '#e9c679';
  context.fillRect(42, 37, 215, 103);
  context.fillStyle = '#8f452f';
  context.fillRect(42, 37, 215, 20);
  context.fillStyle = '#f7ddaa';
  context.fillRect(61, 66, 72, 54);
  context.fillRect(158, 66, 79, 54);
  context.fillStyle = '#536f72';
  context.fillRect(66, 71, 62, 44);
  context.fillRect(163, 71, 69, 44);
  context.fillStyle = '#2f2118';
  context.font = 'bold 11px monospace';
  context.fillText('LANEWAY SPECIALTY', 77, 51);
  context.fillStyle = '#6b5245';
  context.fillRect(37, 140, 225, 7);
}

function drawBarista(context: CanvasRenderingContext2D, isWorking: boolean, time: number): void {
  const bob = isWorking ? Math.floor(time / 220) % 2 : 0;
  context.fillStyle = '#efbd87';
  context.fillRect(153, 82 + bob, 9, 9);
  context.fillStyle = '#352820';
  context.fillRect(151, 80 + bob, 13, 4);
  context.fillStyle = '#5d7982';
  context.fillRect(151, 91 + bob, 13, 17);
  context.fillStyle = '#f7ddaa';
  context.fillRect(165, 95 + bob, 7, 4);
  if (isWorking) {
    context.fillStyle = '#e8e0cd';
    context.fillRect(173, 91, 6, 7);
    const steam = Math.floor(time / 260) % 3;
    context.fillRect(175 + steam, 85 - steam, 1, 4);
  }
}

function drawQueue(context: CanvasRenderingContext2D, queueLength: number, time: number): void {
  const visible = Math.min(queueLength, 6);
  for (let index = 0; index < visible; index += 1) {
    const x = 226 + index * 15;
    const bob = Math.floor(time / 360 + index) % 2;
    const shirts = ['#417b78', '#c86b4a', '#7f6aa2', '#d79b38'];
    context.fillStyle = '#d8a67d';
    context.fillRect(x, 116 + bob, 7, 7);
    context.fillStyle = shirts[index % shirts.length] ?? '#417b78';
    context.fillRect(x - 1, 123 + bob, 9, 13);
    context.fillStyle = '#29201b';
    context.fillRect(x, 136, 3, 9);
    context.fillRect(x + 5, 136, 3, 9);
  }
  if (queueLength > visible) {
    context.fillStyle = '#f7ddaa';
    context.font = 'bold 8px monospace';
    context.fillText(`+${queueLength - visible}`, 302, 112);
  }
}

function drawClosingGlow(context: CanvasRenderingContext2D): void {
  context.fillStyle = 'rgba(242, 193, 78, 0.16)';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = '#f7ddaa';
  context.font = 'bold 9px monospace';
  context.fillText('LAST CUPS DONE', 219, 24);
}
