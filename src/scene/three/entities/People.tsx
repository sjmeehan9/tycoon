import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import type { CustomerSegment, StaffRole } from '../../../game';
import type { ScenePersonPose } from '../../sceneModel';
import type { RenderSnapshot } from '../renderSnapshot';
import { departmentCustomerPoint, departmentStaffPoint } from '../venues/departmentLayout';
import { venueLayoutFor } from '../venues/venueLayout';

interface PeopleProps {
  readonly snapshot: RenderSnapshot;
}

interface PersonPlacement {
  readonly entityId: string;
  readonly x: number;
  readonly z: number;
  readonly rotation: number;
  readonly colour: string;
  readonly phase: number;
  readonly pose: ScenePersonPose;
  readonly progress: number;
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

/** Instanced canonical customers and staff whose animation changes transforms only. */
export function People({ snapshot }: PeopleProps): React.JSX.Element {
  const { customers, staff } = useMemo(() => buildPeople(snapshot), [snapshot]);
  return (
    <group name="instanced-people">
      <PeopleBatch animate={snapshot.presentation.animate} kind="customers" poses={customers} />
      <PeopleBatch animate={snapshot.presentation.animate} kind="staff" poses={staff} />
    </group>
  );
}

function PeopleBatch({
  animate,
  kind,
  poses,
}: {
  readonly animate: boolean;
  readonly kind: 'customers' | 'staff';
  readonly poses: readonly PersonPlacement[];
}): React.JSX.Element {
  const bodiesRef = useRef<InstancedMesh>(null);
  const headsRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const colour = useMemo(() => new Color(), []);

  useLayoutEffect(() => {
    updatePeopleInstances(bodiesRef.current, headsRef.current, colour, dummy, poses, 0);
  }, [colour, dummy, poses]);

  useFrame(({ clock }) => {
    if (!animate) return;
    updatePeopleInstances(
      bodiesRef.current,
      headsRef.current,
      colour,
      dummy,
      poses,
      clock.getElapsedTime(),
    );
  });

  const capacity = Math.max(1, poses.length);
  return (
    <group name={`instanced-${kind}`}>
      <instancedMesh
        args={[undefined, undefined, capacity]}
        castShadow
        count={poses.length}
        frustumCulled={false}
        name={`${kind}-bodies`}
        ref={bodiesRef}
      >
        <boxGeometry args={[0.42, 0.78, 0.34]} />
        <meshStandardMaterial roughness={0.82} vertexColors />
      </instancedMesh>
      <instancedMesh
        args={[undefined, undefined, capacity]}
        castShadow
        count={poses.length}
        frustumCulled={false}
        name={`${kind}-heads`}
        ref={headsRef}
      >
        <sphereGeometry args={[0.24, 7, 5]} />
        <meshStandardMaterial color="#d9a77f" roughness={0.88} />
      </instancedMesh>
    </group>
  );
}

function buildPeople(snapshot: RenderSnapshot): {
  readonly customers: readonly PersonPlacement[];
  readonly staff: readonly PersonPlacement[];
} {
  if (snapshot.identity.venueId === 'departmentStore') return buildDepartmentPeople(snapshot);
  return buildLegacyPeople(snapshot);
}

function buildDepartmentPeople(snapshot: RenderSnapshot): {
  readonly customers: readonly PersonPlacement[];
  readonly staff: readonly PersonPlacement[];
} {
  return {
    customers: snapshot.service.customers.map((customer) => {
      const [x, , z] = departmentCustomerPoint(customer);
      return {
        entityId: customer.entityId,
        x,
        z,
        rotation: customerRotation(customer.pose, customer.stationId),
        colour: SEGMENT_COLOURS[customer.segment],
        phase: stablePhase(customer.entityId),
        pose: customer.pose,
        progress: customer.progress,
      };
    }),
    staff: snapshot.service.staff.map((member) => {
      const [x, , z] = departmentStaffPoint(member);
      return {
        entityId: member.entityId,
        x,
        z,
        rotation: 0,
        colour: STAFF_COLOURS[member.role],
        phase: stablePhase(member.entityId),
        pose: member.pose,
        progress: 1,
      };
    }),
  };
}

function buildLegacyPeople(snapshot: RenderSnapshot): {
  readonly customers: readonly PersonPlacement[];
  readonly staff: readonly PersonPlacement[];
} {
  const layout = venueLayoutFor(snapshot.identity.venueId);
  const customers: PersonPlacement[] = snapshot.service.queue.map((customer, index) => {
    const [x, , z] = layout.queueAnchors[index] ?? layout.overflowAnchor;
    return placement(customer.id, x, z, -Math.PI / 2, SEGMENT_COLOURS[customer.segment], 'waiting');
  });
  if (snapshot.service.active) {
    const [x, , z] = layout.activeCustomerAnchor;
    customers.push(
      placement(
        snapshot.service.active.id,
        x,
        z,
        Math.PI,
        SEGMENT_COLOURS[snapshot.service.active.segment],
        'working',
        snapshot.service.active.progress,
      ),
    );
  }
  const staff: PersonPlacement[] = snapshot.operation.scheduledRoles.map((role, index) => {
    const [x, , z] = layout.staffAnchors[index] ?? layout.ownerAnchor;
    return placement(`staff-${role}-${index}`, x, z, 0, STAFF_COLOURS[role], 'working');
  });
  const [ownerX, , ownerZ] = layout.ownerAnchor;
  staff.push(placement('owner-barista', ownerX, ownerZ, 0, STAFF_COLOURS.barista, 'working'));
  return { customers, staff };
}

function placement(
  entityId: string,
  x: number,
  z: number,
  rotation: number,
  colour: string,
  pose: ScenePersonPose,
  progress = 1,
): PersonPlacement {
  return {
    entityId,
    x,
    z,
    rotation,
    colour,
    phase: stablePhase(entityId),
    pose,
    progress,
  };
}

function updatePeopleInstances(
  bodies: InstancedMesh | null,
  heads: InstancedMesh | null,
  colour: Color,
  dummy: Object3D,
  poses: readonly PersonPlacement[],
  elapsed: number,
): void {
  if (!bodies || !heads) return;
  poses.forEach((placement, index) => {
    const transform = poseTransform(placement, elapsed);
    dummy.position.set(transform.x, transform.bodyY, transform.z);
    dummy.rotation.set(transform.tilt, transform.rotation, transform.roll);
    dummy.scale.set(transform.width, transform.height, 1);
    dummy.updateMatrix();
    bodies.setMatrixAt(index, dummy.matrix);
    bodies.setColorAt(index, colour.set(placement.colour));
    dummy.position.set(transform.x, transform.headY, transform.z);
    dummy.rotation.set(0, transform.rotation, transform.roll * 0.3);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    heads.setMatrixAt(index, dummy.matrix);
  });
  bodies.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
}

function poseTransform(
  placement: PersonPlacement,
  elapsed: number,
): {
  readonly x: number;
  readonly z: number;
  readonly bodyY: number;
  readonly headY: number;
  readonly rotation: number;
  readonly tilt: number;
  readonly roll: number;
  readonly width: number;
  readonly height: number;
} {
  const moving = placement.pose === 'walking' || placement.pose === 'leaving';
  const working = placement.pose === 'working' || placement.pose === 'receiving';
  const animatedBob = elapsed === 0 ? 0 : Math.sin(elapsed * (moving ? 5 : 3) + placement.phase);
  const bob = animatedBob * (moving ? 0.055 : working ? 0.03 : 0.012);
  const stride = moving ? animatedBob * 0.06 : 0;
  const disappointed = placement.pose === 'disappointed';
  const paying = placement.pose === 'paying';
  return {
    x: placement.x + (moving ? stride * Math.cos(placement.rotation) : 0),
    z: placement.z + (moving ? stride * Math.sin(placement.rotation) : 0),
    bodyY: 0.55 + bob - (disappointed ? 0.05 : 0),
    headY: 1.2 + bob - (disappointed ? 0.12 : 0),
    rotation:
      placement.rotation + (working ? animatedBob * 0.08 + (placement.progress - 0.5) * 0.04 : 0),
    tilt: paying ? -0.12 : disappointed ? 0.08 : 0,
    roll: disappointed ? -0.12 : 0,
    width: placement.pose === 'receiving' ? 1.08 : 1,
    height: disappointed ? 0.9 : 1,
  };
}

function customerRotation(pose: ScenePersonPose, stationId: string): number {
  if (pose === 'leaving') return stationId === 'espressoBar' ? -Math.PI / 2 : Math.PI / 2;
  if (pose === 'walking') return Math.PI;
  return 0;
}

function stablePhase(id: string): number {
  let total = 0;
  for (const character of id) total = (total + character.charCodeAt(0)) % 31;
  return total / 5;
}
