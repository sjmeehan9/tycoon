import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import type { EquipmentState, StationId } from '../../../game';
import { ActivityEffects } from '../entities/ActivityEffects';
import { People } from '../entities/People';
import { CART_PALETTE, DEPARTMENT_PALETTE } from '../materials';
import type { RenderSnapshot, RenderStockLevel } from '../renderSnapshot';
import {
  DEPARTMENT_EQUIPMENT_REGISTRY,
  DEPARTMENT_LAYOUT,
  DEPARTMENT_PHYSICAL_UPGRADE_REGISTRY,
  departmentCustomerPoint,
  type DepartmentLod,
} from './departmentLayout';

interface DepartmentStoreWorldProps {
  readonly lod?: DepartmentLod;
  readonly snapshot: RenderSnapshot;
}

interface InstanceTransform {
  readonly position: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: readonly [number, number, number];
  readonly colour?: string;
}

const STATION_IDS = ['espressoBar', 'brewBar', 'coldBar'] as const;
const BAY_COLOURS: Readonly<Record<StationId, string>> = Object.freeze({
  espressoBar: DEPARTMENT_PALETTE.espresso,
  brewBar: DEPARTMENT_PALETTE.brew,
  coldBar: DEPARTMENT_PALETTE.cold,
});

/** Dense three-bay heritage hall driven exclusively by the immutable render snapshot. */
export function DepartmentStoreWorld({
  lod = 'full',
  snapshot,
}: DepartmentStoreWorldProps): React.JSX.Element {
  return (
    <group name="department-store-world">
      <HeritageShell lod={lod} snapshot={snapshot} />
      <TimberPanelling lod={lod} />
      <BrassDetails lod={lod} />
      <VisibleEscalators lod={lod} />
      <ServiceBays snapshot={snapshot} />
      <PhysicalUpgrades snapshot={snapshot} />
      <CommercialEquipment equipment={snapshot.operation.equipment} lod={lod} />
      <DepartmentStockWall snapshot={snapshot} />
      <HallFurniture lod={lod} />
      <QueueMarkers snapshot={snapshot} />
      <ServiceProgress snapshot={snapshot} />
      <People snapshot={snapshot} />
      <ActivityEffects snapshot={snapshot} />
    </group>
  );
}

function HeritageShell({ lod, snapshot }: DepartmentStoreWorldProps): React.JSX.Element {
  const afterHoursGlow = snapshot.operation.cosmetics.includes('afterHoursGlow');
  const mosaicFloor = snapshot.operation.cosmetics.includes('mosaicFloor');
  const daylight = afterHoursGlow
    ? '#ffc06b'
    : snapshot.identity.weather === 'sunny'
      ? '#f4d88f'
      : snapshot.identity.weather === 'coldSnap'
        ? '#c6dce0'
        : snapshot.identity.weather === 'rainy'
          ? '#78989d'
          : '#d5d4bd';
  const tileCount = lod === 'compact' ? 40 : 64;
  const tiles = useMemo(
    () =>
      Array.from({ length: tileCount }, (_, index) => {
        const columns = lod === 'compact' ? 8 : 16;
        const row = Math.floor(index / columns);
        const column = index % columns;
        return {
          position: [column * (20 / columns) - 8.75, 0.025, row * 1.36 + 0.25] as const,
          rotation: [-Math.PI / 2, 0, 0] as const,
          scale: [1, 1, 1] as const,
          colour:
            mosaicFloor && (row * 2 + column) % 4 === 0
              ? DEPARTMENT_PALETTE.brass
              : (row + column) % 3 === 0
                ? DEPARTMENT_PALETTE.tileBurgundy
                : (row + column) % 3 === 1
                  ? DEPARTMENT_PALETTE.tileCream
                  : DEPARTMENT_PALETTE.tileSage,
        };
      }),
    [lod, mosaicFloor, tileCount],
  );
  const columns = [-8.6, -5.9, 5.9, 8.6].map((x) => ({
    position: [x, 2.45, -3.25] as const,
  }));
  const windows = [-7.25, -2.45, 2.45, 7.25].map((x) => ({
    position: [x, 2.6, -3.63] as const,
    colour: daylight,
  }));
  return (
    <group name="motif-patterned-heritage-tiles">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DEPARTMENT_LAYOUT.floor.width, DEPARTMENT_LAYOUT.floor.depth]} />
        <meshStandardMaterial color="#4d453f" roughness={0.98} />
      </mesh>
      <Instances transforms={tiles} type="tile" />
      <mesh receiveShadow position={[0, 3.15, -3.85]}>
        <boxGeometry args={[21.6, 6.3, 0.42]} />
        <meshStandardMaterial color="#9f725e" roughness={0.94} />
      </mesh>
      <mesh receiveShadow position={[-10.75, 2.2, -0.5]}>
        <boxGeometry args={[0.38, 4.4, 7.1]} />
        <meshStandardMaterial color="#79503f" roughness={0.94} />
      </mesh>
      <Instances colour={DEPARTMENT_PALETTE.stone} transforms={columns} type="column" />
      <Instances transforms={windows} type="window" />
      <mesh castShadow position={[0, 5.75, -1.65]} scale={[2.4, 0.54, 1]}>
        <sphereGeometry args={[3.25, lod === 'compact' ? 12 : 18, 8]} />
        <meshStandardMaterial
          color={daylight}
          emissive={daylight}
          emissiveIntensity={afterHoursGlow ? 0.24 : 0.1}
          metalness={0.08}
          opacity={0.8}
          roughness={0.36}
          transparent
        />
      </mesh>
    </group>
  );
}

function TimberPanelling({ lod }: { readonly lod: DepartmentLod }): React.JSX.Element {
  const panels = Array.from({ length: lod === 'compact' ? 12 : 18 }, (_, index) => ({
    position: [-9.7 + index * (19.4 / (lod === 'compact' ? 11 : 17)), 1.15, -3.59] as const,
    scale: [1, 1, 1] as const,
  }));
  return (
    <group name="motif-timber-panelling-counters">
      <Instances colour={DEPARTMENT_PALETTE.timber} transforms={panels} type="panel" />
    </group>
  );
}

function BrassDetails({ lod }: { readonly lod: DepartmentLod }): React.JSX.Element {
  const posts = Array.from({ length: lod === 'compact' ? 8 : 14 }, (_, index) => ({
    position: [-7.1 + index * (14.2 / (lod === 'compact' ? 7 : 13)), 0.52, 4.55] as const,
  }));
  const rails = [-4.1, 0, 4.1].map((x) => ({
    position: [x, 0.72, 2.7] as const,
    rotation: [0, 0, Math.PI / 2] as const,
  }));
  return (
    <group name="motif-brass-rails-details">
      <Instances colour={DEPARTMENT_PALETTE.brass} transforms={posts} type="brass-post" />
      <Instances colour={DEPARTMENT_PALETTE.brassBright} transforms={rails} type="brass-rail" />
    </group>
  );
}

function VisibleEscalators({ lod }: { readonly lod: DepartmentLod }): React.JSX.Element {
  const steps = Array.from({ length: lod === 'compact' ? 8 : 14 }, (_, index) => ({
    position: [7.35 + index * 0.13, 0.22 + index * 0.17, -0.8 - index * 0.13] as const,
  }));
  return (
    <group name="motif-visible-escalators">
      <Instances colour="#5f6768" transforms={steps} type="escalator-step" />
      <mesh castShadow position={[8.55, 1.55, -2]} rotation={[0.75, 0, -0.75]}>
        <boxGeometry args={[0.12, 4.5, 0.12]} />
        <meshStandardMaterial color={DEPARTMENT_PALETTE.brass} metalness={0.58} roughness={0.34} />
      </mesh>
      <mesh castShadow position={[7.55, 1.55, -2.8]} rotation={[0.75, 0, -0.75]}>
        <boxGeometry args={[0.12, 4.5, 0.12]} />
        <meshStandardMaterial color={DEPARTMENT_PALETTE.brass} metalness={0.58} roughness={0.34} />
      </mesh>
    </group>
  );
}

function ServiceBays({ snapshot }: { readonly snapshot: RenderSnapshot }): React.JSX.Element {
  const polishedPlaques = snapshot.operation.cosmetics.includes('brassBayPlaques');
  const afterHoursGlow = snapshot.operation.cosmetics.includes('afterHoursGlow');
  const counterBodies = STATION_IDS.map((stationId) => ({
    position: DEPARTMENT_LAYOUT.stations[stationId].counter,
    colour: BAY_COLOURS[stationId],
  }));
  const counterTops = STATION_IDS.map((stationId) => {
    const [x, , z] = DEPARTMENT_LAYOUT.stations[stationId].counter;
    return { position: [x, 1.5, z] as const };
  });
  const plaques = DEPARTMENT_PHYSICAL_UPGRADE_REGISTRY.map((anchorId) => ({
    position: DEPARTMENT_LAYOUT.physicalUpgradeAnchors[anchorId],
    colour:
      polishedPlaques || afterHoursGlow
        ? DEPARTMENT_PALETTE.brassBright
        : anchorId === 'hallEntry'
          ? DEPARTMENT_PALETTE.brass
          : BAY_COLOURS[
              anchorId === 'espressoBay'
                ? 'espressoBar'
                : anchorId === 'brewBay'
                  ? 'brewBar'
                  : 'coldBar'
            ],
  }));
  return (
    <group name="motif-three-distinct-service-bays">
      <Instances transforms={counterBodies} type="counter" />
      <Instances colour={DEPARTMENT_PALETTE.stone} transforms={counterTops} type="counter-top" />
      <group name="physical-upgrade-anchor-registry">
        <Instances transforms={plaques} type="bay-plaque" />
      </group>
      {snapshot.operation.hasStreetSign ? (
        <mesh castShadow name="physical-upgrade-street-sign" position={[-8.4, 2.1, 2.2]}>
          <boxGeometry args={[1.55, 1, 0.14]} />
          <meshStandardMaterial color={CART_PALETTE.wattle} roughness={0.68} />
        </mesh>
      ) : null}
    </group>
  );
}

function PhysicalUpgrades({ snapshot }: { readonly snapshot: RenderSnapshot }): React.JSX.Element {
  const has = (id: RenderSnapshot['operation']['improvements'][number]): boolean =>
    snapshot.operation.improvements.includes(id);
  return (
    <group name="purchased-physical-upgrades">
      {has('heritage-welcome-marquee') ? (
        <group
          name="physical-upgrade-heritage-welcome-marquee"
          position={DEPARTMENT_LAYOUT.physicalUpgradeAnchors.hallEntry}
        >
          <mesh castShadow position={[0, 0, 0.18]}>
            <boxGeometry args={[3.05, 0.82, 0.24]} />
            <meshStandardMaterial
              color={DEPARTMENT_PALETTE.brassBright}
              metalness={0.62}
              roughness={0.3}
            />
          </mesh>
          <mesh castShadow position={[0, -0.52, 0.12]}>
            <boxGeometry args={[2.45, 0.16, 0.16]} />
            <meshStandardMaterial color={DEPARTMENT_PALETTE.tileCream} roughness={0.55} />
          </mesh>
        </group>
      ) : null}
      {has('espresso-order-pass') ? (
        <group
          name="physical-upgrade-espresso-order-pass"
          position={DEPARTMENT_LAYOUT.physicalUpgradeAnchors.espressoBay}
        >
          <mesh castShadow position={[0, -1.18, 1.1]}>
            <boxGeometry args={[2.8, 0.14, 0.24]} />
            <meshStandardMaterial
              color={DEPARTMENT_PALETTE.brass}
              metalness={0.55}
              roughness={0.34}
            />
          </mesh>
          <mesh castShadow position={[0, -0.88, 1.1]}>
            <boxGeometry args={[0.55, 0.5, 0.18]} />
            <meshStandardMaterial color={DEPARTMENT_PALETTE.espresso} roughness={0.55} />
          </mesh>
        </group>
      ) : null}
      {has('brew-gallery') ? (
        <group
          name="physical-upgrade-brew-gallery"
          position={DEPARTMENT_LAYOUT.physicalUpgradeAnchors.brewBay}
        >
          {[-0.72, 0, 0.72].map((x) => (
            <mesh castShadow key={x} position={[x, -0.82, 0.9]}>
              <cylinderGeometry args={[0.2, 0.24, 0.76, 10]} />
              <meshStandardMaterial
                color={DEPARTMENT_PALETTE.brew}
                metalness={0.22}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>
      ) : null}
      {has('cold-collection-rail') ? (
        <group
          name="physical-upgrade-cold-collection-rail"
          position={DEPARTMENT_LAYOUT.physicalUpgradeAnchors.coldBay}
        >
          <mesh castShadow position={[0, -1.2, 1.05]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 3.05, 8]} />
            <meshStandardMaterial
              color={DEPARTMENT_PALETTE.brassBright}
              metalness={0.62}
              roughness={0.3}
            />
          </mesh>
          <mesh castShadow position={[0, -0.86, 1.02]}>
            <boxGeometry args={[1.25, 0.38, 0.3]} />
            <meshStandardMaterial color={DEPARTMENT_PALETTE.cold} roughness={0.42} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

function CommercialEquipment({
  equipment,
  lod,
}: {
  readonly equipment: Readonly<EquipmentState>;
  readonly lod: DepartmentLod;
}): React.JSX.Element {
  return (
    <group name="tier-three-commercial-equipment">
      {DEPARTMENT_EQUIPMENT_REGISTRY.map((equipmentId) => {
        const level = equipment[equipmentId];
        if (level <= 0) return null;
        return (
          <EquipmentMesh
            equipmentId={equipmentId}
            key={equipmentId}
            level={level}
            lod={lod}
            position={DEPARTMENT_LAYOUT.equipment[equipmentId]}
          />
        );
      })}
    </group>
  );
}

function EquipmentMesh({
  equipmentId,
  level,
  lod,
  position,
}: {
  readonly equipmentId: keyof EquipmentState;
  readonly level: number;
  readonly lod: DepartmentLod;
  readonly position: readonly [number, number, number];
}): React.JSX.Element {
  const width = 0.62 + level * 0.18;
  if (equipmentId === 'grinder' || equipmentId === 'batchBrewer') {
    return (
      <mesh castShadow={lod === 'full'} name={`equipment-${equipmentId}`} position={position}>
        <cylinderGeometry args={[width * 0.32, width * 0.42, 0.86, 8]} />
        <meshStandardMaterial color="#465354" metalness={0.28} roughness={0.44} />
      </mesh>
    );
  }
  return (
    <mesh castShadow={lod === 'full'} name={`equipment-${equipmentId}`} position={position}>
      <boxGeometry args={[width, equipmentId === 'refrigeration' ? 1.45 : 0.72, 0.72]} />
      <meshStandardMaterial
        color={equipmentId === 'pos' ? '#233738' : '#93a2a1'}
        metalness={0.32}
        roughness={0.42}
      />
    </mesh>
  );
}

function DepartmentStockWall({
  snapshot,
}: {
  readonly snapshot: RenderSnapshot;
}): React.JSX.Element {
  const stock = snapshot.operation.stock.map((item, index) => ({
    position: [-6.95 + (index % 3) * 0.72, 0.65 + Math.floor(index / 3) * 0.68, -1.73] as const,
    colour: stockColour(item.level),
  }));
  return (
    <group name="department-stock-cues">
      <mesh castShadow position={[-6.25, 1.45, -2.05]}>
        <boxGeometry args={[2.8, 2.9, 0.36]} />
        <meshStandardMaterial color={DEPARTMENT_PALETTE.timberDark} roughness={0.92} />
      </mesh>
      <Instances transforms={stock} type="stock" />
    </group>
  );
}

function HallFurniture({ lod }: { readonly lod: DepartmentLod }): React.JSX.Element {
  const count = lod === 'compact' ? 10 : 18;
  const tables = Array.from({ length: count }, (_, index) => ({
    position: [-7.4 + (index % 6) * 1.35, 0.48, 5.35 + Math.floor(index / 6) * 0.82] as const,
  }));
  return (
    <group name="instanced-department-furnishings">
      <Instances colour={DEPARTMENT_PALETTE.timber} transforms={tables} type="table" />
    </group>
  );
}

function QueueMarkers({ snapshot }: { readonly snapshot: RenderSnapshot }): React.JSX.Element {
  const markers = snapshot.service.customers
    .filter(({ status }) => status === 'approach' || status === 'queued')
    .map((customer) => {
      const [x, , z] = departmentCustomerPoint(customer);
      return {
        position: [x, 0.035, z] as const,
        rotation: [-Math.PI / 2, 0, 0] as const,
        colour: customer.laneId === 'express' ? CART_PALETTE.wattle : '#ead7b1',
      };
    });
  return <Instances transforms={markers} type="queue-marker" />;
}

function ServiceProgress({ snapshot }: { readonly snapshot: RenderSnapshot }): React.JSX.Element {
  const jobs = snapshot.service.activeJobs.map((customer) => {
    const [x, , z] = departmentCustomerPoint(customer);
    return {
      position: [x - 0.45 + customer.progress * 0.9, 2.02, z - 0.62] as const,
      colour: BAY_COLOURS[customer.stationId],
    };
  });
  return <Instances transforms={jobs} type="service-progress" />;
}

function Instances({
  colour,
  transforms,
  type,
}: {
  readonly colour?: string;
  readonly transforms: readonly InstanceTransform[];
  readonly type:
    | 'bay-plaque'
    | 'brass-post'
    | 'brass-rail'
    | 'column'
    | 'counter'
    | 'counter-top'
    | 'escalator-step'
    | 'panel'
    | 'queue-marker'
    | 'service-progress'
    | 'stock'
    | 'table'
    | 'tile'
    | 'window';
}): React.JSX.Element | null {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    transforms.forEach((transform, index) => {
      dummy.position.set(...transform.position);
      dummy.rotation.set(...(transform.rotation ?? [0, 0, 0]));
      dummy.scale.set(...(transform.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      if (transform.colour) mesh.setColorAt(index, new Color(transform.colour));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dummy, transforms]);
  if (transforms.length === 0) return null;
  const material = (
    <meshStandardMaterial
      color={colour}
      metalness={type.startsWith('brass') ? 0.55 : 0.04}
      opacity={type === 'window' ? 0.78 : 1}
      roughness={type.startsWith('brass') ? 0.34 : 0.82}
      transparent={type === 'window'}
      vertexColors={colour === undefined}
    />
  );
  return (
    <instancedMesh
      args={[undefined, undefined, Math.max(1, transforms.length)]}
      castShadow={type !== 'tile' && type !== 'queue-marker'}
      count={transforms.length}
      frustumCulled={false}
      name={`instanced-${type}`}
      receiveShadow={type === 'tile' || type === 'counter' || type === 'panel'}
      ref={ref}
    >
      {instanceGeometry(type)}
      {material}
    </instancedMesh>
  );
}

function instanceGeometry(type: Parameters<typeof Instances>[0]['type']): React.JSX.Element {
  if (type === 'tile') return <planeGeometry args={[1.14, 1.25]} />;
  if (type === 'column') return <cylinderGeometry args={[0.32, 0.43, 4.9, 10]} />;
  if (type === 'window') return <boxGeometry args={[2.1, 2.3, 0.08]} />;
  if (type === 'panel') return <boxGeometry args={[0.86, 1.8, 0.1]} />;
  if (type === 'brass-post') return <cylinderGeometry args={[0.055, 0.07, 1.04, 7]} />;
  if (type === 'brass-rail') return <cylinderGeometry args={[0.05, 0.05, 3.2, 7]} />;
  if (type === 'escalator-step') return <boxGeometry args={[1.65, 0.14, 0.52]} />;
  if (type === 'counter') return <boxGeometry args={[3.5, 1.44, 1.38]} />;
  if (type === 'counter-top') return <boxGeometry args={[3.72, 0.16, 1.58]} />;
  if (type === 'bay-plaque') return <boxGeometry args={[2.65, 0.58, 0.12]} />;
  if (type === 'stock') return <boxGeometry args={[0.5, 0.38, 0.4]} />;
  if (type === 'table') return <boxGeometry args={[1.08, 0.16, 0.55]} />;
  if (type === 'queue-marker') return <circleGeometry args={[0.27, 8]} />;
  return <sphereGeometry args={[0.11, 7, 5]} />;
}

function stockColour(level: RenderStockLevel): string {
  if (level === 'empty') return CART_PALETTE.walkaway;
  if (level === 'low') return CART_PALETTE.wattle;
  return CART_PALETTE.eucalyptus;
}
