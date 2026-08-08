export const MAX_DEVICE_PIXEL_RATIO = 1.5;
export const COMPACT_DEVICE_PIXEL_RATIO = 1.25;
export const SHADOW_MAP_SIZE = 1_024;
export const COMPACT_SHADOW_MAP_SIZE = 512;

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

export const DEPARTMENT_PALETTE = Object.freeze({
  tileCream: '#d6c49d',
  tileBurgundy: '#7b3f3a',
  tileSage: '#65755f',
  timber: '#704633',
  timberDark: '#3f2d25',
  brass: '#b68b3e',
  brassBright: '#dfbd68',
  espresso: '#914f3f',
  brew: '#4f6b58',
  cold: '#4e6f82',
  stone: '#d7c8aa',
});

/** Cap device pixel ratio to protect integrated and mobile GPUs. */
export function boundedDevicePixelRatio(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(MAX_DEVICE_PIXEL_RATIO, Math.max(1, devicePixelRatio));
}

/** Cap responsive department-hall DPR without affecting other venue rendering. */
export function boundedDepartmentDevicePixelRatio(
  devicePixelRatio: number,
  compact: boolean,
): number {
  const maximum = compact ? COMPACT_DEVICE_PIXEL_RATIO : MAX_DEVICE_PIXEL_RATIO;
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(maximum, Math.max(1, devicePixelRatio));
}
