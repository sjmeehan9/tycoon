import type { OrthographicCamera } from 'three';

import type { VenueId } from '../../game';

export const ISOMETRIC_CAMERA_POSITION = Object.freeze([10, 8, 10] as const);
export const ISOMETRIC_CAMERA_TARGET = Object.freeze([0, 0.8, 0] as const);
export const ORTHOGRAPHIC_VERTICAL_HALF_EXTENT = 5.2;
export const DEPARTMENT_FULL_VERTICAL_HALF_EXTENT = 5.8;
export const DEPARTMENT_COMPACT_VERTICAL_HALF_EXTENT = 5.15;
export const DEPARTMENT_CAMERA_POSITION = Object.freeze([11.8, 9.2, 12.4] as const);
export const DEPARTMENT_CAMERA_TARGET = Object.freeze([0, 0.72, 0.3] as const);

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
  return orthographicProjectionForExtent(width, height, ORTHOGRAPHIC_VERTICAL_HALF_EXTENT);
}

/** Return a stable orthographic frustum for an explicit venue-scoped vertical extent. */
export function orthographicProjectionForExtent(
  width: number,
  height: number,
  verticalHalfExtent: number,
): OrthographicProjection {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const aspect = safeWidth / safeHeight;
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

/** Apply responsive venue framing while retaining the proven legacy framing elsewhere. */
export function configureServiceCamera(
  camera: OrthographicCamera,
  width: number,
  height: number,
  venueId: VenueId,
  compact: boolean,
): void {
  if (venueId !== 'departmentStore') {
    configureIsometricCamera(camera, width, height);
    return;
  }
  const extent = compact
    ? DEPARTMENT_COMPACT_VERTICAL_HALF_EXTENT
    : DEPARTMENT_FULL_VERTICAL_HALF_EXTENT;
  const projection = orthographicProjectionForExtent(width, height, extent);
  camera.left = projection.left;
  camera.right = projection.right;
  camera.top = projection.top;
  camera.bottom = projection.bottom;
  camera.near = projection.near;
  camera.far = projection.far;
  camera.position.set(...DEPARTMENT_CAMERA_POSITION);
  camera.lookAt(...DEPARTMENT_CAMERA_TARGET);
  camera.updateProjectionMatrix();
}
