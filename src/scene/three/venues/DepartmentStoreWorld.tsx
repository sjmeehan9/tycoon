import { useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { People } from '../entities/People';
import { CART_PALETTE } from '../materials';
import type { RenderSnapshot, RenderStockLevel } from '../renderSnapshot';
import { venueLayoutFor } from './venueLayout';

interface DepartmentStoreWorldProps {
  readonly snapshot: RenderSnapshot;
}

const LAYOUT = venueLayoutFor('departmentStore');

/** Heritage department-store hall driven by the existing single-queue engine snapshot. */
export function DepartmentStoreWorld({ snapshot }: DepartmentStoreWorldProps): React.JSX.Element {
  const latest = snapshot.service.activity.at(-1);
  return (
    <group name="department-store-world">
      <HeritageHall snapshot={snapshot} />
      <GrandCoffeeCounter snapshot={snapshot} />
      <CommercialEquipment snapshot={snapshot} />
      <DepartmentStockWall snapshot={snapshot} />
      <HallFurniture />
      <QueueMarkers count={snapshot.service.queue.length} />
      <People snapshot={snapshot} />
      <ServiceCue snapshot={snapshot} />
      <ActivityCue
        hasSale={snapshot.service.activity.some((event) => event.type === 'sale')}
        hasWalkaway={snapshot.service.activity.some((event) => event.type === 'walkaway')}
        latestType={latest?.type ?? 'arrival'}
      />
    </group>
  );
}

function HeritageHall({ snapshot }: DepartmentStoreWorldProps): React.JSX.Element {
  const accent =
    snapshot.operation.awning === 'neonCup'
      ? '#73547f'
      : snapshot.operation.awning === 'wattleAwning'
        ? '#4f735d'
        : '#9b493d';
  const daylight =
    snapshot.identity.weather === 'sunny'
      ? '#f4d88f'
      : snapshot.identity.weather === 'coldSnap'
        ? '#c6dce0'
        : snapshot.identity.weather === 'rainy'
          ? '#78989d'
          : '#d5d4bd';
  return (
    <group name="heritage-department-hall">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LAYOUT.floor.width, LAYOUT.floor.depth]} />
        <meshStandardMaterial color="#514943" roughness={0.98} />
      </mesh>
      <TerrazzoFloor />
      <mesh receiveShadow position={[0, 3.1, -3.8]}>
        <boxGeometry args={[14.8, 6.2, 0.4]} />
        <meshStandardMaterial color="#a96f55" roughness={0.94} />
      </mesh>
      <mesh receiveShadow position={[-7.2, 2.7, -0.6]}>
        <boxGeometry args={[0.38, 5.4, 6.8]} />
        <meshStandardMaterial color="#7e503f" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 5.78, -1.0]} scale={[1.85, 0.58, 1.05]}>
        <sphereGeometry args={[3.35, 18, 10]} />
        <meshStandardMaterial
          color={daylight}
          emissive={daylight}
          emissiveIntensity={0.12}
          metalness={0.08}
          opacity={0.82}
          roughness={0.36}
          transparent
        />
      </mesh>
      <HeritageColumns />
      <group name="department-sign" position={[0, 3.3, -3.48]}>
        <mesh castShadow>
          <boxGeometry args={[7.4, 0.92, 0.16]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.12}
            roughness={0.74}
          />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[4.9, 0.13, 0.05]} />
          <meshStandardMaterial color="#f1dbb1" emissive="#d8aa62" emissiveIntensity={0.22} />
        </mesh>
      </group>
      <HallWindows colour={daylight} />
    </group>
  );
}

function TerrazzoFloor(): React.JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tiles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        x: (index % 9) * 1.25 - 5,
        z: 0.7 + Math.floor(index / 9) * 1.22,
      })),
    [],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    tiles.forEach((tile, index) => {
      dummy.position.set(tile.x, 0.018, tile.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, tiles]);
  return (
    <instancedMesh args={[undefined, undefined, tiles.length]} count={tiles.length} ref={ref}>
      <planeGeometry args={[1.16, 1.13]} />
      <meshStandardMaterial color="#81756b" roughness={0.96} />
    </instancedMesh>
  );
}

function HeritageColumns(): React.JSX.Element {
  return (
    <group name="heritage-columns">
      {[-6, -3.9, 3.9, 6].map((x) => (
        <group key={x} position={[x, 2.3, -2.95]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.34, 0.44, 4.6, 12]} />
            <meshStandardMaterial color="#d7c4a0" roughness={0.88} />
          </mesh>
          <mesh castShadow position={[0, 2.18, 0]}>
            <boxGeometry args={[0.82, 0.22, 0.82]} />
            <meshStandardMaterial color="#e3d1ac" roughness={0.86} />
          </mesh>
          <mesh receiveShadow position={[0, -2.18, 0]}>
            <boxGeometry args={[0.76, 0.24, 0.76]} />
            <meshStandardMaterial color="#b99f78" roughness={0.92} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HallWindows({ colour }: { readonly colour: string }): React.JSX.Element {
  return (
    <group name="heritage-windows" position={[0, 2.05, -3.53]}>
      {[-5, -2.55, 2.55, 5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.35, 2.15, 0.08]} />
            <meshStandardMaterial
              color={colour}
              emissive={colour}
              emissiveIntensity={0.1}
              opacity={0.78}
              roughness={0.3}
              transparent
            />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.08, 2.2, 0.04]} />
            <meshStandardMaterial color="#58463a" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GrandCoffeeCounter({ snapshot }: DepartmentStoreWorldProps): React.JSX.Element {
  const accent = snapshot.operation.awning === 'neonCup' ? '#72517f' : CART_PALETTE.service;
  return (
    <group name="single-grand-service-counter" position={[-0.75, 0, -0.85]}>
      <mesh castShadow receiveShadow position={[0, 0.72, 0]}>
        <boxGeometry args={[9.3, 1.44, 1.42]} />
        <meshStandardMaterial color="#734938" roughness={0.84} />
      </mesh>
      <mesh castShadow position={[0, 1.51, 0]}>
        <boxGeometry args={[9.65, 0.16, 1.7]} />
        <meshStandardMaterial color="#d9c7aa" metalness={0.04} roughness={0.58} />
      </mesh>
      <mesh castShadow position={[4.05, 1.66, 0.42]}>
        <boxGeometry args={[1.25, 0.18, 0.72]} />
        <meshStandardMaterial color={accent} roughness={0.66} />
      </mesh>
    </group>
  );
}

function CommercialEquipment({ snapshot }: DepartmentStoreWorldProps): React.JSX.Element {
  const equipment = snapshot.operation.equipment;
  return (
    <group name="commercial-equipment" position={[-0.9, 1.58, -1.12]}>
      {equipment.espressoMachine > 0 ? (
        <mesh castShadow position={[0.4, 0.38, 0]}>
          <boxGeometry args={[1.7 + equipment.espressoMachine * 0.42, 0.78, 0.74]} />
          <meshStandardMaterial color="#8d9b9d" metalness={0.4} roughness={0.4} />
        </mesh>
      ) : null}
      {equipment.grinder > 0 ? (
        <group position={[-2.05, 0.36, 0]}>
          {Array.from({ length: equipment.grinder }, (_, index) => (
            <mesh castShadow key={index} position={[index * 0.5, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.3, 0.74, 8]} />
              <meshStandardMaterial color="#303938" metalness={0.15} roughness={0.54} />
            </mesh>
          ))}
        </group>
      ) : null}
      {equipment.batchBrewer > 0 ? (
        <group position={[2.45, 0.34, 0]}>
          {Array.from({ length: equipment.batchBrewer }, (_, index) => (
            <mesh castShadow key={index} position={[index * 0.58, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.37, 0.7, 8]} />
              <meshStandardMaterial color="#536f72" metalness={0.24} roughness={0.46} />
            </mesh>
          ))}
        </group>
      ) : null}
      {equipment.pos > 0 ? (
        <mesh castShadow position={[3.8, 0.25, 0.22]} rotation={[0, -0.28, 0]}>
          <boxGeometry args={[0.5 + equipment.pos * 0.14, 0.55, 0.26]} />
          <meshStandardMaterial color="#203638" roughness={0.38} />
        </mesh>
      ) : null}
      {equipment.refrigeration > 0 ? (
        <mesh castShadow position={[-4.2, -0.55, -0.18]}>
          <boxGeometry args={[1.15 + equipment.refrigeration * 0.34, 1.5, 1]} />
          <meshStandardMaterial color="#b4c5c5" metalness={0.18} roughness={0.5} />
        </mesh>
      ) : null}
      {equipment.serviceCounter > 0 ? (
        <mesh castShadow position={[4.7, -0.02, 0.78]}>
          <boxGeometry args={[0.8 + equipment.serviceCounter * 0.46, 0.28, 0.82]} />
          <meshStandardMaterial color={CART_PALETTE.service} roughness={0.64} />
        </mesh>
      ) : null}
    </group>
  );
}

function DepartmentStockWall({ snapshot }: DepartmentStoreWorldProps): React.JSX.Element {
  return (
    <group name="department-stock-cues" position={LAYOUT.stockAnchor}>
      <mesh castShadow position={[0, 1.48, 0]}>
        <boxGeometry args={[3.25, 3, 0.4]} />
        <meshStandardMaterial color="#5b4034" roughness={0.94} />
      </mesh>
      {snapshot.operation.stock.map((stock, index) => (
        <mesh
          castShadow
          key={stock.ingredientId}
          position={[-1.05 + (index % 3) * 1.05, 0.5 + Math.floor(index / 3) * 0.94, 0.3]}
        >
          <boxGeometry args={[0.78, 0.42, 0.46]} />
          <meshStandardMaterial
            color={stockColour(stock.level)}
            emissive={stock.level === 'available' ? '#000000' : stockColour(stock.level)}
            emissiveIntensity={stock.level === 'available' ? 0 : 0.18}
            roughness={0.84}
          />
        </mesh>
      ))}
    </group>
  );
}

function HallFurniture(): React.JSX.Element {
  return (
    <group name="department-hall-furnishings">
      {[-4.8, -2.8].map((x) => (
        <group key={x} position={[x, 0.56, 3.75]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.18, 0.55]} />
            <meshStandardMaterial color="#75503d" roughness={0.88} />
          </mesh>
          <mesh castShadow position={[-0.55, -0.34, 0]}>
            <boxGeometry args={[0.12, 0.68, 0.44]} />
            <meshStandardMaterial color="#40342d" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0.55, -0.34, 0]}>
            <boxGeometry args={[0.12, 0.68, 0.44]} />
            <meshStandardMaterial color="#40342d" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function QueueMarkers({ count }: { readonly count: number }): React.JSX.Element {
  return (
    <group name="department-single-queue-markers">
      {LAYOUT.queueAnchors.slice(0, count).map((anchor, index) => (
        <mesh key={index} position={[anchor[0], 0.026, anchor[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.31, 8]} />
          <meshStandardMaterial
            color={index === 0 ? CART_PALETTE.service : '#ead7b1'}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function ServiceCue({ snapshot }: DepartmentStoreWorldProps): React.JSX.Element | null {
  const active = snapshot.service.active;
  if (!active) return null;
  return (
    <group name="department-single-service-cue" position={LAYOUT.serviceAnchor}>
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.3, 8]} />
        <meshStandardMaterial color={CART_PALETTE.cream} roughness={0.7} />
      </mesh>
      <mesh position={[-0.5 + active.progress, 0.38, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial
          color={CART_PALETTE.service}
          emissive={CART_PALETTE.service}
          emissiveIntensity={0.52}
        />
      </mesh>
    </group>
  );
}

function ActivityCue({
  hasSale,
  hasWalkaway,
  latestType,
}: {
  readonly hasSale: boolean;
  readonly hasWalkaway: boolean;
  readonly latestType: string;
}): React.JSX.Element {
  return (
    <group name="department-activity-cues" position={LAYOUT.activityAnchor}>
      {hasSale ? (
        <mesh castShadow position={[0, 0.56, 0]}>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color={CART_PALETTE.sale}
            emissive={CART_PALETTE.sale}
            emissiveIntensity={latestType === 'sale' ? 0.65 : 0.2}
          />
        </mesh>
      ) : null}
      {hasWalkaway ? (
        <mesh castShadow position={[0.7, 0.5, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.26, 0.7, 5]} />
          <meshStandardMaterial
            color={CART_PALETTE.walkaway}
            emissive={CART_PALETTE.walkaway}
            emissiveIntensity={latestType === 'walkaway' ? 0.55 : 0.12}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function stockColour(level: RenderStockLevel): string {
  if (level === 'empty') return CART_PALETTE.walkaway;
  if (level === 'low') return CART_PALETTE.wattle;
  return CART_PALETTE.eucalyptus;
}
