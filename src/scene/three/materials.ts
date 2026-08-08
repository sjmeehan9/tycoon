export const MAX_DEVICE_PIXEL_RATIO = 1.5;
export const SHADOW_MAP_SIZE = 1_024;

export const CART_PALETTE = Object.freeze({
  skyMild: '#a7c4bb',
  skySunny: '#e9c96b',
  skyRainy: '#78949b',
  skyCold: '#b6cad0',
  brick: '#a9543f',
  brickDark: '#74382d',
  ground: '#5a4a43',
  groundLight: '#75625a',
  cream: '#f2d7aa',
  coffee: '#392820',
  timber: '#8c563d',
  wattle: '#e8aa3c',
  eucalyptus: '#527963',
  sale: '#f3c64b',
  walkaway: '#d75a4a',
  service: '#5ca6a6',
  metal: '#7e8c8d',
});

/** Cap device pixel ratio to protect integrated and mobile GPUs. */
export function boundedDevicePixelRatio(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(MAX_DEVICE_PIXEL_RATIO, Math.max(1, devicePixelRatio));
}
