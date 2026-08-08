import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D } from 'three';
import type { InstancedMesh } from 'three';

import type { CustomerSegment, StaffRole } from '../../../game';
import type { RenderSnapshot } from '../renderSnapshot';
import { venueLayoutFor } from '../venues/venueLayout';

interface PeopleProps {
  readonly snapshot: RenderSnapshot;
}

interface PersonPose {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly rotation: number;
  readonly colour: string;
  readonly phase: number;
}

const SEGMENT_COLOURS: Readonly<Record<CustomerSegment, string>> = Object.freeze({
  commuter: '#4d7084',
  student: '#b86548',
  enthusiast: '#6f548b',
  regular: '#4f8368',
});

const STAFF_COLOURS: Readonly<Record<StaffRole, string>> = Object.freeze({
  barista: '#d58a42',
  frontOfHouse: '#d6b74f',
  manager: '#546c99',
  runner: '#4f8a73',
});

/** Instanced customers and staff whose animation changes transforms only. */
export function People({ snapshot }: PeopleProps): React.JSX.Element {
  const poses = useMemo(() => buildPeople(snapshot), [snapshot]);
  const batches = useMemo(() => batchPeople(poses), [poses]);
  return (
    <group name="instanced-people">
      {batches.map((batch) => (
        <PeopleBatch
          animate={snapshot.presentation.animate}
          colour={batch.colour}
          key={batch.colour}
          poses={batch.poses}
          speed={snapshot.service.speed}
        />
      ))}
    </group>
  );
}

function PeopleBatch({
  animate,
  colour,
  poses,
  speed,
}: {
  readonly animate: boolean;
  readonly colour: string;
  readonly poses: readonly PersonPose[];
  readonly speed: number;
}): React.JSX.Element {
  const bodiesRef = useRef<InstancedMesh>(null);
  const headsRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    updatePeopleInstances(bodiesRef.current, headsRef.current, dummy, poses, 0);
  }, [dummy, poses]);

  useFrame(({ clock }) => {
    if (!animate) return;
    const elapsed = clock.getElapsedTime() * Math.min(2, speed);
    updatePeopleInstances(bodiesRef.current, headsRef.current, dummy, poses, elapsed);
  });

  const capacity = Math.max(1, poses.length);
  return (
    <group>
      <instancedMesh
        args={[undefined, undefined, capacity]}
        castShadow
        count={poses.length}
        ref={bodiesRef}
      >
        <boxGeometry args={[0.42, 0.78, 0.34]} />
        <meshBasicMaterial color={colour} toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        args={[undefined, undefined, capacity]}
        castShadow
        count={poses.length}
        ref={headsRef}
      >
        <sphereGeometry args={[0.24, 7, 5]} />
        <meshBasicMaterial color="#d9a77f" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function batchPeople(
  poses: readonly PersonPose[],
): readonly { readonly colour: string; readonly poses: readonly PersonPose[] }[] {
  const batches = new Map<string, PersonPose[]>();
  for (const pose of poses) {
    const batch = batches.get(pose.colour) ?? [];
    batch.push(pose);
    batches.set(pose.colour, batch);
  }
  return Array.from(batches, ([colour, batch]) => ({ colour, poses: batch }));
}

function buildPeople(snapshot: RenderSnapshot): readonly PersonPose[] {
  const layout = venueLayoutFor(snapshot.identity.venueId);
  const people: PersonPose[] = snapshot.service.queue.map((customer, index) => {
    const [x, , z] = layout.queueAnchors[index] ?? layout.overflowAnchor;
    return {
      id: customer.id,
      x,
      z,
      rotation: -Math.PI / 2,
      colour: SEGMENT_COLOURS[customer.segment],
      phase: stablePhase(customer.id),
    };
  });
  if (snapshot.service.active) {
    const [x, , z] = layout.activeCustomerAnchor;
    people.push({
      id: snapshot.service.active.id,
      x,
      z,
      rotation: Math.PI,
      colour: SEGMENT_COLOURS[snapshot.service.active.segment],
      phase: stablePhase(snapshot.service.active.id),
    });
  }
  snapshot.operation.scheduledRoles.forEach((role, index) => {
    const [x, , z] = layout.staffAnchors[index] ?? layout.ownerAnchor;
    people.push({
      id: `staff-${role}-${index}`,
      x,
      z,
      rotation: 0,
      colour: STAFF_COLOURS[role],
      phase: index * 0.8,
    });
  });
  const [ownerX, , ownerZ] = layout.ownerAnchor;
  people.push({
    id: 'owner-barista',
    x: ownerX,
    z: ownerZ,
    rotation: 0,
    colour: STAFF_COLOURS.barista,
    phase: 0,
  });
  return people;
}

function updatePeopleInstances(
  bodies: InstancedMesh | null,
  heads: InstancedMesh | null,
  dummy: Object3D,
  poses: readonly PersonPose[],
  elapsed: number,
): void {
  if (!bodies || !heads) return;
  poses.forEach((pose, index) => {
    const bob = elapsed === 0 ? 0 : Math.sin(elapsed * 3 + pose.phase) * 0.035;
    dummy.position.set(pose.x, 0.55 + bob, pose.z);
    dummy.rotation.set(0, pose.rotation, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bodies.setMatrixAt(index, dummy.matrix);
    dummy.position.set(pose.x, 1.2 + bob, pose.z);
    dummy.rotation.set(0, pose.rotation, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    heads.setMatrixAt(index, dummy.matrix);
  });
  bodies.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
}

function stablePhase(id: string): number {
  let total = 0;
  for (const character of id) total = (total + character.charCodeAt(0)) % 31;
  return total / 5;
}
