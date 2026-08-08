import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { People } from '../entities/People';
import { CART_PALETTE } from '../materials';
import type { RenderSnapshot, RenderStockLevel } from '../renderSnapshot';
import { venueLayoutFor } from './venueLayout';

interface KioskWorldProps {
  readonly snapshot: RenderSnapshot;
}

const LAYOUT = venueLayoutFor('kiosk');

/** Sheltered permanent kiosk with visible storage, service lane, and owned equipment. */
export function KioskWorld({ snapshot }: KioskWorldProps): React.JSX.Element {
  const latest = snapshot.service.activity.at(-1);
  const latestSale = snapshot.service.activity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot.service.activity.findLast((event) => event.type === 'walkaway');
  return (
    <group name="kiosk-world">
      <KioskGround />
      <KioskShell snapshot={snapshot} />
      <KioskEquipment snapshot={snapshot} />
      <KioskStorage snapshot={snapshot} />
      <QueueMarkers count={snapshot.service.queue.length} />
      <People snapshot={snapshot} />
      <ServiceCue snapshot={snapshot} />
      <ActivityCue
        hasSale={latestSale !== undefined}
        hasWalkaway={latestWalkaway !== undefined}
        latestType={latest?.type ?? 'arrival'}
      />
      <KioskWeather snapshot={snapshot} />
    </group>
  );
}

function KioskGround(): React.JSX.Element {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LAYOUT.floor.width, LAYOUT.floor.depth]} />
        <meshStandardMaterial color="#62564f" roughness={1} />
      </mesh>
      <KioskTiles />
    </group>
  );
}

function KioskTiles(): React.JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tiles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        x: (index % 6) * 1.45 - 3.4,
        z: 1.55 + Math.floor(index / 6) * 1.18,
      })),
    [],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    tiles.forEach((tile, index) => {
      dummy.position.set(tile.x, 0.016, tile.z);
      dummy.rotation.set(-Math.PI / 2, 0, index % 2 === 0 ? 0.015 : -0.015);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, tiles]);
  return (
    <instancedMesh args={[undefined, undefined, tiles.length]} count={tiles.length} ref={ref}>
      <planeGeometry args={[1.32, 1.06]} />
      <meshStandardMaterial color="#80716a" roughness={1} />
    </instancedMesh>
  );
}

function KioskShell({ snapshot }: KioskWorldProps): React.JSX.Element {
  const trim =
    snapshot.operation.awning === 'neonCup'
      ? '#76507f'
      : snapshot.operation.awning === 'wattleAwning'
        ? CART_PALETTE.eucalyptus
        : '#ad533e';
  return (
    <group name="permanent-kiosk" position={[-0.75, 0, -0.85]}>
      <mesh receiveShadow position={[0, 1.75, -2.45]}>
        <boxGeometry args={[9.2, 3.5, 0.3]} />
        <meshStandardMaterial color="#b7654c" roughness={0.94} />
      </mesh>
      <mesh receiveShadow position={[-4.45, 1.65, -0.7]}>
        <boxGeometry args={[0.28, 3.3, 3.7]} />
        <meshStandardMaterial color="#8d493c" roughness={0.96} />
      </mesh>
      <mesh castShadow position={[0, 3.5, -0.75]}>
        <boxGeometry args={[9.35, 0.22, 3.9]} />
        <meshStandardMaterial color="#49362e" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.35, 0.7, 0.28]} receiveShadow>
        <boxGeometry args={[6.8, 1.4, 1.25]} />
        <meshStandardMaterial color={CART_PALETTE.timber} roughness={0.83} />
      </mesh>
      <mesh castShadow position={[0.35, 1.46, 0.28]}>
        <boxGeometry args={[7.15, 0.15, 1.52]} />
        <meshStandardMaterial color={CART_PALETTE.cream} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0.15, 2.65, -2.18]}>
        <boxGeometry args={[5.1, 0.8, 0.16]} />
        <meshStandardMaterial
          color={trim}
          emissive={trim}
          emissiveIntensity={0.12}
          roughness={0.8}
        />
      </mesh>
      <KioskCanopy trim={trim} />
      <PickupRail />
      <KioskFurnishings />
    </group>
  );
}

function KioskCanopy({ trim }: { readonly trim: string }): React.JSX.Element {
  return (
    <group position={[0.35, 2.25, 0.65]}>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh castShadow key={index} position={[-3 + index, 0, 0]} rotation={[0.04, 0, 0]}>
          <boxGeometry args={[0.52, 0.12, 2.08]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? trim : CART_PALETTE.cream}
            roughness={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function PickupRail(): React.JSX.Element {
  return (
    <group name="pickup-rail" position={[3.35, 1.6, 0.75]}>
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.16, 0.7]} />
        <meshStandardMaterial color={CART_PALETTE.service} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.72, 0.22, 0.08]} />
        <meshStandardMaterial
          color="#d9f0e8"
          emissive="#5ca6a6"
          emissiveIntensity={0.25}
          roughness={0.72}
        />
      </mesh>
    </group>
  );
}

function KioskFurnishings(): React.JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const positions = useMemo(
    () =>
      [
        [-3.25, 0.42, 2.4],
        [-2.05, 0.42, 2.4],
        [-3.25, 0.42, 3.35],
        [-2.05, 0.42, 3.35],
      ] as const,
    [],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    positions.forEach(([x, y, z], index) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, index % 2 === 0 ? 0.08 : -0.08, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, positions]);
  return (
    <instancedMesh
      args={[undefined, undefined, positions.length]}
      count={positions.length}
      ref={ref}
    >
      <cylinderGeometry args={[0.34, 0.38, 0.72, 8]} />
      <meshStandardMaterial color="#3d5e58" roughness={0.9} />
    </instancedMesh>
  );
}

function KioskEquipment({ snapshot }: KioskWorldProps): React.JSX.Element {
  const equipment = snapshot.operation.equipment;
  return (
    <group name="kiosk-equipment" position={[-0.55, 1.54, -0.82]}>
      {equipment.espressoMachine > 0 ? (
        <mesh
          castShadow
          position={[0.15, 0.35, 0]}
          scale={[1 + equipment.espressoMachine * 0.18, 1, 1]}
        >
          <boxGeometry args={[1.35, 0.7, 0.68]} />
          <meshStandardMaterial color="#849597" metalness={0.32} roughness={0.45} />
        </mesh>
      ) : null}
      {equipment.grinder > 0 ? (
        <group position={[-1.25, 0.34, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.29, 0.7, 8]} />
            <meshStandardMaterial color="#3d413f" roughness={0.62} />
          </mesh>
          {equipment.grinder > 1 ? (
            <mesh castShadow position={[-0.48, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.29, 0.7, 8]} />
              <meshStandardMaterial color="#3d413f" roughness={0.62} />
            </mesh>
          ) : null}
        </group>
      ) : null}
      {equipment.batchBrewer > 0 ? (
        <mesh castShadow position={[1.25, 0.28, 0]}>
          <cylinderGeometry args={[0.32, 0.38, 0.62 + equipment.batchBrewer * 0.08, 8]} />
          <meshStandardMaterial color="#5a7273" metalness={0.2} roughness={0.5} />
        </mesh>
      ) : null}
      {equipment.pos > 0 ? (
        <mesh castShadow position={[2.25, 0.22, 0.12]} rotation={[0, -0.28, 0]}>
          <boxGeometry args={[0.45 + equipment.pos * 0.08, 0.5, 0.25]} />
          <meshStandardMaterial color="#23383a" roughness={0.42} />
        </mesh>
      ) : null}
      {equipment.refrigeration > 0 ? (
        <mesh castShadow position={[-2.55, -0.68, -0.18]}>
          <boxGeometry args={[0.95, 1.18, 0.85]} />
          <meshStandardMaterial color="#a6bec0" metalness={0.12} roughness={0.55} />
        </mesh>
      ) : null}
      {equipment.serviceCounter > 0 ? (
        <mesh castShadow position={[3.08, -0.2, 0.28]}>
          <boxGeometry args={[0.78 + equipment.serviceCounter * 0.28, 0.25, 0.82]} />
          <meshStandardMaterial color={CART_PALETTE.service} roughness={0.72} />
        </mesh>
      ) : null}
    </group>
  );
}

function KioskStorage({ snapshot }: KioskWorldProps): React.JSX.Element {
  return (
    <group name="stock-cues" position={LAYOUT.stockAnchor}>
      <mesh castShadow position={[0, 1.3, 0]}>
        <boxGeometry args={[2.2, 2.6, 0.36]} />
        <meshStandardMaterial color="#5e4437" roughness={0.94} />
      </mesh>
      {snapshot.operation.stock.slice(0, 6).map((stock, index) => (
        <mesh
          castShadow
          key={stock.ingredientId}
          position={[-0.68 + (index % 3) * 0.68, 0.58 + Math.floor(index / 3) * 1.06, 0.27]}
        >
          <boxGeometry args={[0.5, 0.45, 0.42]} />
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

function QueueMarkers({ count }: { readonly count: number }): React.JSX.Element {
  return (
    <group name="kiosk-queue-markers">
      {LAYOUT.queueAnchors
        .slice(0, Math.min(count, LAYOUT.queueAnchors.length))
        .map((anchor, index) => (
          <mesh
            key={index}
            position={[anchor[0], 0.025, anchor[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.31, 8]} />
            <meshStandardMaterial
              color={index === 0 ? CART_PALETTE.service : '#ead3a9'}
              roughness={1}
            />
          </mesh>
        ))}
    </group>
  );
}

function ServiceCue({ snapshot }: KioskWorldProps): React.JSX.Element | null {
  const active = snapshot.service.active;
  if (!active) return null;
  return (
    <group position={LAYOUT.serviceAnchor}>
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.3, 8]} />
        <meshStandardMaterial color={CART_PALETTE.cream} roughness={0.7} />
      </mesh>
      <mesh position={[-0.48 + active.progress * 0.96, 0.37, 0]}>
        <sphereGeometry args={[0.095, 8, 6]} />
        <meshStandardMaterial
          color={CART_PALETTE.service}
          emissive={CART_PALETTE.service}
          emissiveIntensity={0.5}
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
    <group name="kiosk-activity-cues" position={LAYOUT.activityAnchor}>
      {hasSale ? (
        <mesh castShadow position={[0, 0.55, 0]}>
          <octahedronGeometry args={[0.31, 0]} />
          <meshStandardMaterial
            color={CART_PALETTE.sale}
            emissive={CART_PALETTE.sale}
            emissiveIntensity={latestType === 'sale' ? 0.65 : 0.2}
          />
        </mesh>
      ) : null}
      {hasWalkaway ? (
        <mesh castShadow position={[0.68, 0.5, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.26, 0.68, 5]} />
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

function KioskWeather({ snapshot }: KioskWorldProps): React.JSX.Element {
  if (snapshot.identity.weather === 'sunny') {
    return (
      <group name="weather-sunny">
        <mesh position={[5.4, 5.15, -2.7]}>
          <icosahedronGeometry args={[0.6, 1]} />
          <meshStandardMaterial color="#ffd56b" emissive="#e9a735" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[-3.7, 1.85, 1.2]}>
          <sphereGeometry args={[0.32, 8, 6]} />
          <meshStandardMaterial color="#6f916f" roughness={0.9} />
        </mesh>
      </group>
    );
  }
  if (snapshot.identity.weather === 'rainy') {
    return <RainCurtain animate={snapshot.presentation.animate} />;
  }
  if (snapshot.identity.weather === 'coldSnap') {
    return (
      <group name="weather-cold-snap">
        <mesh position={[-3.55, 2.55, -2.05]}>
          <circleGeometry args={[0.55, 10]} />
          <meshStandardMaterial color="#d9e8e9" emissive="#78979d" emissiveIntensity={0.28} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
          <planeGeometry args={[17, 10]} />
          <meshStandardMaterial color="#bdd0d0" opacity={0.13} transparent />
        </mesh>
      </group>
    );
  }
  return (
    <group name="weather-mild" position={[-3.8, 2.55, -2.05]}>
      <mesh>
        <circleGeometry args={[0.46, 10]} />
        <meshStandardMaterial color="#f0d7a2" emissive="#b27f4a" emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

function RainCurtain({ animate }: { readonly animate: boolean }): React.JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        x: ((index * 37) % 150) / 10 - 7.5,
        y: 0.8 + ((index * 19) % 50) / 10,
        z: 1.3 + ((index * 23) % 55) / 10,
      })),
    [],
  );
  const update = (elapsed: number): void => {
    const mesh = ref.current;
    if (!mesh) return;
    drops.forEach((drop, index) => {
      const y = animate ? ((drop.y - elapsed * 2.4 + 8) % 5.2) + 0.4 : drop.y;
      dummy.position.set(drop.x, y, drop.z);
      dummy.rotation.set(0, 0, 0.22);
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
