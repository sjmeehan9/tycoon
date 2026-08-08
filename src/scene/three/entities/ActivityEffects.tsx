import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { MAX_SCENE_EFFECTS, type SceneCustomerStatus } from '../../sceneModel';
import type { RenderSnapshot } from '../renderSnapshot';
import { departmentCustomerPoint } from '../venues/departmentLayout';

interface ActivityEffectsProps {
  readonly snapshot: RenderSnapshot;
}

interface ActivityEffect {
  readonly id: string;
  readonly status: SceneCustomerStatus;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly colour: string;
  readonly phase: number;
}

const EFFECT_COLOURS: Readonly<Partial<Record<SceneCustomerStatus, string>>> = Object.freeze({
  service: '#f4eee0',
  handoff: '#f2c84b',
  payment: '#78a96f',
  stockout: '#d65b49',
  abandonment: '#d97857',
  exit: '#d8b798',
});

/** Bounded snapshot-derived service, sale, and departure cues for the department hall. */
export function ActivityEffects({ snapshot }: ActivityEffectsProps): React.JSX.Element | null {
  const effects = useMemo(() => buildEffects(snapshot), [snapshot]);
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const colour = useMemo(() => new Color(), []);

  useLayoutEffect(
    () => updateEffects(meshRef.current, colour, dummy, effects, 0),
    [colour, dummy, effects],
  );
  useFrame(({ clock }) => {
    if (!snapshot.presentation.animate) return;
    updateEffects(meshRef.current, colour, dummy, effects, clock.getElapsedTime());
  });

  if (effects.length === 0) return null;
  return (
    <instancedMesh
      args={[undefined, undefined, Math.max(1, effects.length)]}
      count={effects.length}
      frustumCulled={false}
      name="canonical-activity-effects"
      ref={meshRef}
    >
      <octahedronGeometry args={[0.16, 0]} />
      <meshStandardMaterial
        emissive="#6b5226"
        emissiveIntensity={0.24}
        roughness={0.5}
        vertexColors
      />
    </instancedMesh>
  );
}

function buildEffects(snapshot: RenderSnapshot): ActivityEffect[] {
  return snapshot.service.customers
    .filter(({ status }) => EFFECT_COLOURS[status] !== undefined)
    .slice(0, MAX_SCENE_EFFECTS)
    .map((customer) => {
      const [x, , z] = departmentCustomerPoint(customer);
      return {
        id: `effect:${customer.entityId}:${customer.status}`,
        status: customer.status,
        x,
        y: customer.status === 'service' ? 1.85 : 1.55,
        z,
        colour: EFFECT_COLOURS[customer.status] ?? '#f4eee0',
        phase: stablePhase(customer.entityId),
      };
    });
}

function updateEffects(
  mesh: InstancedMesh | null,
  colour: Color,
  dummy: Object3D,
  effects: readonly ActivityEffect[],
  elapsed: number,
): void {
  if (!mesh) return;
  effects.forEach((effect, index) => {
    const pulse = elapsed === 0 ? 0 : Math.sin(elapsed * 4 + effect.phase);
    const service = effect.status === 'service';
    const scale = service ? 0.65 + Math.abs(pulse) * 0.25 : 0.95 + pulse * 0.12;
    dummy.position.set(
      effect.x,
      effect.y + (service ? Math.abs(pulse) * 0.22 : pulse * 0.05),
      effect.z,
    );
    dummy.rotation.set(0, elapsed === 0 ? effect.phase : elapsed + effect.phase, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.setColorAt(index, colour.set(effect.colour));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function stablePhase(id: string): number {
  let total = 0;
  for (const character of id) total = (total + character.charCodeAt(0)) % 37;
  return total / 6;
}
