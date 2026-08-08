import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { People } from '../entities/People';
import { CART_PALETTE } from '../materials';
import type { RenderSnapshot, RenderStockLevel } from '../renderSnapshot';
import { venueLayoutFor } from './venueLayout';

interface CafeWorldProps {
  readonly snapshot: RenderSnapshot;
}

const LAYOUT = venueLayoutFor('cafe');

/** Full neighbourhood cafe with open sightlines across service, storage, and seating. */
export function CafeWorld({ snapshot }: CafeWorldProps): React.JSX.Element {
  const latest = snapshot.service.activity.at(-1);
  const latestSale = snapshot.service.activity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot.service.activity.findLast((event) => event.type === 'walkaway');
  return (
    <group name="cafe-world">
      <CafeFloor />
      <CafeShell snapshot={snapshot} />
      <CafeEquipment snapshot={snapshot} />
      <CafeStockWall snapshot={snapshot} />
      <CafeFurniture />
      <QueueMarkers count={snapshot.service.queue.length} />
      <People snapshot={snapshot} />
      <ServiceCue snapshot={snapshot} />
      <ActivityCue
        hasSale={latestSale !== undefined}
        hasWalkaway={latestWalkaway !== undefined}
        latestType={latest?.type ?? 'arrival'}
      />
      <CafeWeather snapshot={snapshot} />
    </group>
  );
}

function CafeFloor(): React.JSX.Element {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LAYOUT.floor.width, LAYOUT.floor.depth]} />
        <meshStandardMaterial color="#4f4944" roughness={1} />
      </mesh>
      <CafeTiles />
    </group>
  );
}

function CafeTiles(): React.JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tiles = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => ({
        x: (index % 8) * 1.14 - 4.05,
        z: 0.9 + Math.floor(index / 8) * 1.08,
      })),
    [],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    tiles.forEach((tile, index) => {
      dummy.position.set(tile.x, 0.016, tile.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, new Color(index % 2 === 0 ? '#756b62' : '#685f58'));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dummy, tiles]);
  return (
    <instancedMesh args={[undefined, undefined, tiles.length]} count={tiles.length} ref={ref}>
      <planeGeometry args={[1.06, 1]} />
      <meshStandardMaterial roughness={1} vertexColors />
    </instancedMesh>
  );
}

function CafeShell({ snapshot }: CafeWorldProps): React.JSX.Element {
  const accent =
    snapshot.operation.awning === 'neonCup'
      ? '#80558c'
      : snapshot.operation.awning === 'wattleAwning'
        ? '#527963'
        : '#a94f3b';
  return (
    <group name="specialty-cafe" position={[-0.8, 0, -1.05]}>
      <mesh receiveShadow position={[0, 2.15, -2.55]}>
        <boxGeometry args={[10.8, 4.3, 0.32]} />
        <meshStandardMaterial color="#a95c47" roughness={0.96} />
      </mesh>
      <mesh receiveShadow position={[-5.25, 1.8, -0.75]}>
        <boxGeometry args={[0.3, 3.6, 3.9]} />
        <meshStandardMaterial color="#7c4337" roughness={0.97} />
      </mesh>
      <mesh castShadow position={[-0.35, 3.85, -1.1]}>
        <boxGeometry args={[10.2, 0.2, 3.35]} />
        <meshStandardMaterial color="#49372f" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[-0.35, 2.82, -2.28]}>
        <boxGeometry args={[6.4, 0.72, 0.16]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.1}
          roughness={0.82}
        />
      </mesh>
      <CafeWindows weather={snapshot.identity.weather} />
      <CafeCounters />
      <DisplayCase />
      <PendantAmbience accent={accent} />
      <CafePlants />
    </group>
  );
}

function CafeWindows({
  weather,
}: {
  readonly weather: RenderSnapshot['identity']['weather'];
}): React.JSX.Element {
  const glass = weather === 'sunny' ? '#eacb7a' : weather === 'coldSnap' ? '#b9d0d5' : '#79999c';
  return (
    <group position={[1.65, 1.75, -2.35]}>
      {[-1.55, 0, 1.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.25, 1.42, 0.08]} />
            <meshStandardMaterial
              color={glass}
              emissive={glass}
              emissiveIntensity={0.1}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.09, 1.48, 0.05]} />
            <meshStandardMaterial color="#3f302a" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CafeCounters(): React.JSX.Element {
  return (
    <group name="cafe-counter">
      <mesh castShadow position={[0.25, 0.7, 0.22]} receiveShadow>
        <boxGeometry args={[7.25, 1.4, 1.28]} />
        <meshStandardMaterial color="#87513b" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0.25, 1.48, 0.22]}>
        <boxGeometry args={[7.55, 0.16, 1.52]} />
        <meshStandardMaterial color="#e7cfaa" roughness={0.68} />
      </mesh>
      <mesh castShadow position={[-3.08, 0.68, 1.72]} receiveShadow>
        <boxGeometry args={[1.25, 1.36, 3.2]} />
        <meshStandardMaterial color="#87513b" roughness={0.84} />
      </mesh>
      <mesh castShadow position={[-3.08, 1.45, 1.72]}>
        <boxGeometry args={[1.48, 0.15, 3.35]} />
        <meshStandardMaterial color="#e7cfaa" roughness={0.68} />
      </mesh>
      <mesh castShadow position={[3.42, 1.63, 0.68]}>
        <boxGeometry args={[1.2, 0.18, 0.72]} />
        <meshStandardMaterial color={CART_PALETTE.service} roughness={0.7} />
      </mesh>
    </group>
  );
}

function DisplayCase(): React.JSX.Element {
  return (
    <group name="display-case" position={[-2.25, 1.72, 0.35]}>
      <mesh castShadow>
        <boxGeometry args={[1.35, 0.72, 0.82]} />
        <meshStandardMaterial
          color="#a9c2c1"
          metalness={0.1}
          opacity={0.72}
          roughness={0.35}
          transparent
        />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[-0.42 + index * 0.42, 0, 0.42]}>
          <cylinderGeometry args={[0.12, 0.16, 0.1, 8]} />
          <meshStandardMaterial color={index === 1 ? '#d59c56' : '#b86c4a'} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function PendantAmbience({ accent }: { readonly accent: string }): React.JSX.Element {
  return (
    <group name="cafe-ambience">
      {[-2.4, -0.3, 1.8].map((x) => (
        <group key={x} position={[x, 2.75, 0.2]}>
          <mesh castShadow>
            <coneGeometry args={[0.34, 0.46, 10]} />
            <meshStandardMaterial color={accent} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshStandardMaterial color="#ffe0a0" emissive="#ffc15a" emissiveIntensity={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CafePlants(): React.JSX.Element {
  return (
    <group name="cafe-plants">
      {(
        [
          [-4.55, 0.42, 2.65],
          [4.5, 0.42, -1.65],
        ] as const
      ).map(([x, y, z]) => (
        <group key={x} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.26, 0.32, 0.65, 8]} />
            <meshStandardMaterial color="#8f5b3f" roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, 0.55, 0]}>
            <icosahedronGeometry args={[0.52, 1]} />
            <meshStandardMaterial color="#54785e" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CafeEquipment({ snapshot }: CafeWorldProps): React.JSX.Element {
  const equipment = snapshot.operation.equipment;
  return (
    <group name="cafe-equipment" position={[-0.65, 1.57, -1.06]}>
      {equipment.espressoMachine > 0 ? (
        <mesh
          castShadow
          position={[0.25, 0.38, 0]}
          scale={[1 + equipment.espressoMachine * 0.23, 1, 1]}
        >
          <boxGeometry args={[1.5, 0.76, 0.7]} />
          <meshStandardMaterial color="#89999b" metalness={0.38} roughness={0.42} />
        </mesh>
      ) : null}
      {equipment.grinder > 0 ? (
        <group position={[-1.42, 0.35, 0]}>
          {Array.from({ length: equipment.grinder }, (_, index) => (
            <mesh castShadow key={index} position={[-index * 0.48, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.3, 0.72, 8]} />
              <meshStandardMaterial color="#343a39" roughness={0.58} />
            </mesh>
          ))}
        </group>
      ) : null}
      {equipment.batchBrewer > 0 ? (
        <group position={[1.55, 0.32, 0]}>
          {Array.from({ length: equipment.batchBrewer }, (_, index) => (
            <mesh castShadow key={index} position={[index * 0.55, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.37, 0.66, 8]} />
              <meshStandardMaterial color="#536d70" metalness={0.22} roughness={0.48} />
            </mesh>
          ))}
        </group>
      ) : null}
      {equipment.pos > 0 ? (
        <mesh castShadow position={[2.7, 0.23, 0.15]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.48 + equipment.pos * 0.1, 0.52, 0.25]} />
          <meshStandardMaterial color="#213538" roughness={0.4} />
        </mesh>
      ) : null}
      {equipment.refrigeration > 0 ? (
        <mesh
          castShadow
          position={[-3.55, -0.58, -0.15]}
          scale={[1 + equipment.refrigeration * 0.2, 1, 1]}
        >
          <boxGeometry args={[1.15, 1.45, 0.95]} />
          <meshStandardMaterial color="#adc1c2" metalness={0.15} roughness={0.52} />
        </mesh>
      ) : null}
      {equipment.serviceCounter > 0 ? (
        <mesh castShadow position={[3.85, -0.05, 0.72]}>
          <boxGeometry args={[0.72 + equipment.serviceCounter * 0.35, 0.26, 0.78]} />
          <meshStandardMaterial color={CART_PALETTE.service} roughness={0.68} />
        </mesh>
      ) : null}
    </group>
  );
}

function CafeStockWall({ snapshot }: CafeWorldProps): React.JSX.Element {
  return (
    <group name="stock-cues" position={LAYOUT.stockAnchor}>
      <mesh castShadow position={[0, 1.45, 0]}>
        <boxGeometry args={[2.7, 2.9, 0.38]} />
        <meshStandardMaterial color="#5b4136" roughness={0.94} />
      </mesh>
      {snapshot.operation.stock.map((stock, index) => (
        <mesh
          castShadow
          key={stock.ingredientId}
          position={[-0.84 + (index % 3) * 0.84, 0.48 + Math.floor(index / 3) * 0.92, 0.29]}
        >
          <boxGeometry args={[0.62, 0.4, 0.45]} />
          <meshStandardMaterial
            color={stockColour(stock.level)}
            emissive={stock.level === 'available' ? '#000000' : stockColour(stock.level)}
            emissiveIntensity={stock.level === 'available' ? 0 : 0.18}
            roughness={0.86}
          />
        </mesh>
      ))}
    </group>
  );
}

function CafeFurniture(): React.JSX.Element {
  const tablesRef = useRef<InstancedMesh>(null);
  const chairsRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tables = useMemo(
    () =>
      [
        [-4.2, 0.74, 3.55],
        [-2.65, 0.74, 3.55],
        [-4.2, 0.74, 4.9],
        [-2.65, 0.74, 4.9],
      ] as const,
    [],
  );
  const chairs = useMemo(
    () =>
      tables.flatMap(
        ([x, , z]) =>
          [
            [x - 0.55, 0.46, z],
            [x + 0.55, 0.46, z],
            [x, 0.46, z + 0.55],
          ] as const,
      ),
    [tables],
  );
  useLayoutEffect(() => {
    const tablesMesh = tablesRef.current;
    const chairsMesh = chairsRef.current;
    if (!tablesMesh || !chairsMesh) return;
    tables.forEach(([x, y, z], index) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, index % 2 === 0 ? 0.04 : -0.04, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      tablesMesh.setMatrixAt(index, dummy.matrix);
    });
    chairs.forEach(([x, y, z], index) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, (index % 3) * (Math.PI / 2), 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      chairsMesh.setMatrixAt(index, dummy.matrix);
    });
    tablesMesh.instanceMatrix.needsUpdate = true;
    chairsMesh.instanceMatrix.needsUpdate = true;
  }, [chairs, dummy, tables]);
  return (
    <group name="instanced-cafe-furnishings">
      <instancedMesh
        args={[undefined, undefined, tables.length]}
        count={tables.length}
        ref={tablesRef}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.12, 10]} />
        <meshStandardMaterial color="#8c5a41" roughness={0.88} />
      </instancedMesh>
      <instancedMesh
        args={[undefined, undefined, chairs.length]}
        count={chairs.length}
        ref={chairsRef}
      >
        <boxGeometry args={[0.42, 0.72, 0.42]} />
        <meshStandardMaterial color="#486c62" roughness={0.88} />
      </instancedMesh>
    </group>
  );
}

function QueueMarkers({ count }: { readonly count: number }): React.JSX.Element {
  return (
    <group name="cafe-queue-markers">
      {LAYOUT.queueAnchors
        .slice(0, Math.min(count, LAYOUT.queueAnchors.length))
        .map((anchor, index) => (
          <mesh
            key={index}
            position={[anchor[0], 0.026, anchor[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.31, 8]} />
            <meshStandardMaterial
              color={index === 0 ? CART_PALETTE.service : '#e8d1a7'}
              roughness={1}
            />
          </mesh>
        ))}
    </group>
  );
}

function ServiceCue({ snapshot }: CafeWorldProps): React.JSX.Element | null {
  const active = snapshot.service.active;
  if (!active) return null;
  return (
    <group position={LAYOUT.serviceAnchor}>
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
    <group name="cafe-activity-cues" position={LAYOUT.activityAnchor}>
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

function CafeWeather({ snapshot }: CafeWorldProps): React.JSX.Element {
  if (snapshot.identity.weather === 'sunny') {
    return (
      <group name="weather-sunny">
        <mesh position={[5.45, 5.2, -2.8]}>
          <icosahedronGeometry args={[0.62, 1]} />
          <meshStandardMaterial color="#ffd56b" emissive="#e9a735" emissiveIntensity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.8, 0.032, -0.2]}>
          <planeGeometry args={[5.5, 3.4]} />
          <meshStandardMaterial color="#f0cb76" opacity={0.09} transparent />
        </mesh>
      </group>
    );
  }
  if (snapshot.identity.weather === 'rainy') {
    return <WindowRain animate={snapshot.presentation.animate} />;
  }
  if (snapshot.identity.weather === 'coldSnap') {
    return (
      <group name="weather-cold-snap">
        <mesh position={[4.25, 2.55, -3.18]}>
          <circleGeometry args={[0.58, 10]} />
          <meshStandardMaterial color="#dcebec" emissive="#78979d" emissiveIntensity={0.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.034, 0]}>
          <planeGeometry args={[17, 11]} />
          <meshStandardMaterial color="#bdd0d0" opacity={0.11} transparent />
        </mesh>
      </group>
    );
  }
  return (
    <group name="weather-mild" position={[4.2, 2.55, -3.17]}>
      <mesh>
        <circleGeometry args={[0.46, 10]} />
        <meshStandardMaterial color="#f0d7a2" emissive="#b27f4a" emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

function WindowRain({ animate }: { readonly animate: boolean }): React.JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => ({
        x: ((index * 41) % 96) / 10 - 4.8,
        y: 0.7 + ((index * 17) % 49) / 10,
        z: -3.2 + ((index * 11) % 8) / 10,
      })),
    [],
  );
  const update = (elapsed: number): void => {
    const mesh = ref.current;
    if (!mesh) return;
    drops.forEach((drop, index) => {
      const y = animate ? ((drop.y - elapsed * 2.2 + 8) % 5.1) + 0.35 : drop.y;
      dummy.position.set(drop.x, y, drop.z);
      dummy.rotation.set(0, 0, 0.2);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, new Color('#b9dde0'));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
  useLayoutEffect(() => update(0));
  useFrame(({ clock }) => {
    if (animate) update(clock.getElapsedTime());
  });
  return (
    <instancedMesh
      args={[undefined, undefined, drops.length]}
      count={drops.length}
      name="weather-rainy"
      ref={ref}
    >
      <boxGeometry args={[0.035, 0.34, 0.035]} />
      <meshStandardMaterial opacity={0.72} transparent vertexColors />
    </instancedMesh>
  );
}

function stockColour(level: RenderStockLevel): string {
  if (level === 'empty') return CART_PALETTE.walkaway;
  if (level === 'low') return CART_PALETTE.wattle;
  return CART_PALETTE.eucalyptus;
}
