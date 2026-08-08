import type { OrthographicCamera } from 'three';

export const ISOMETRIC_CAMERA_POSITION = Object.freeze([10, 8, 10] as const);
export const ISOMETRIC_CAMERA_TARGET = Object.freeze([0, 0.8, 0] as const);
export const ORTHOGRAPHIC_VERTICAL_HALF_EXTENT = 5.2;

export interface OrthographicProjection {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly near: number;
  readonly far: number;
}

/** Return a stable orthographic frustum for the current responsive canvas size. */
export function orthographicProjection(width: number, height: number): OrthographicProjection {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const aspect = safeWidth / safeHeight;
  const verticalHalfExtent = ORTHOGRAPHIC_VERTICAL_HALF_EXTENT;
  return Object.freeze({
    left: -verticalHalfExtent * aspect,
    right: verticalHalfExtent * aspect,
    top: verticalHalfExtent,
    bottom: -verticalHalfExtent,
    near: 0.1,
    far: 100,
  });
}

/** Apply the fixed-isometric projection without introducing camera-owned game state. */
export function configureIsometricCamera(
  camera: OrthographicCamera,
  width: number,
  height: number,
): void {
  const projection = orthographicProjection(width, height);
  camera.left = projection.left;
  camera.right = projection.right;
  camera.top = projection.top;
  camera.bottom = projection.bottom;
  camera.near = projection.near;
  camera.far = projection.far;
  camera.position.set(...ISOMETRIC_CAMERA_POSITION);
  camera.lookAt(...ISOMETRIC_CAMERA_TARGET);
  camera.updateProjectionMatrix();
}
