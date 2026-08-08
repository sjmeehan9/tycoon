import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { People } from '../entities/People';
import { CART_PALETTE } from '../materials';
import type { RenderSnapshot } from '../renderSnapshot';

interface CartWorldProps {
  readonly snapshot: RenderSnapshot;
}

/** Procedural low-poly cart venue driven exclusively by a render snapshot. */
export function CartWorld({ snapshot }: CartWorldProps): React.JSX.Element {
  const awningColour =
    snapshot.operation.awning === 'neonCup'
      ? '#80588c'
      : snapshot.operation.awning === 'wattleAwning'
        ? CART_PALETTE.eucalyptus
        : '#b7553d';
  const latest = snapshot.service.activity.at(-1);
  const latestSale = snapshot.service.activity.findLast((event) => event.type === 'sale');
  const latestWalkaway = snapshot.service.activity.findLast((event) => event.type === 'walkaway');

  return (
    <group name="cart-world">
      <WorldGround />
      <LanewayBackdrop snapshot={snapshot} />
      <group name="coffee-cart" position={[-0.4, 0, -0.55]}>
        <mesh castShadow position={[0, 0.9, 0]} receiveShadow>
          <boxGeometry args={[4.35, 1.35, 1.8]} />
          <meshStandardMaterial color={CART_PALETTE.timber} roughness={0.82} />
        </mesh>
        <mesh castShadow position={[0, 1.72, 0]}>
          <boxGeometry args={[4.85, 0.14, 2.25]} />
          <meshStandardMaterial color={awningColour} roughness={0.75} />
        </mesh>
        <AwningStripes colour={awningColour} />
        <mesh castShadow position={[0, 1.25, 0.94]}>
          <boxGeometry args={[4.5, 0.22, 0.24]} />
          <meshStandardMaterial color={CART_PALETTE.cream} roughness={0.88} />
        </mesh>
        <CartWheels />
        <Equipment snapshot={snapshot} />
        {snapshot.operation.hasStreetSign ? <StreetSign /> : null}
      </group>
      <QueueMarkers count={snapshot.service.queue.length} />
      <People snapshot={snapshot} />
      <ServiceCue snapshot={snapshot} />
      <ActivityCue
        hasSale={latestSale !== undefined}
        hasWalkaway={latestWalkaway !== undefined}
        latestType={latest?.type ?? 'arrival'}
      />
      <Weather snapshot={snapshot} />
    </group>
  );
}

function WorldGround(): React.JSX.Element {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color={CART_PALETTE.ground} roughness={1} />
      </mesh>
      <GroundTiles />
    </group>
  );
}

function GroundTiles(): React.JSX.Element {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tiles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        x: (index % 7) * 1.55 - 4.7,
        z: 1.6 + Math.floor(index / 7) * 1.25,
      })),
    [],
  );
  useLayoutEffect(() => {
    if (!ref.current) return;
    tiles.forEach((tile, index) => {
      dummy.position.set(tile.x, 0.015, tile.z);
      dummy.rotation.set(-Math.PI / 2, 0, index % 2 === 0 ? 0.02 : -0.02);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(index, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [dummy, tiles]);
  return (
    <instancedMesh
      args={[undefined, undefined, tiles.length]}
      count={tiles.length}
      receiveShadow
      ref={ref}
    >
      <planeGeometry args={[1.42, 1.12]} />
      <meshStandardMaterial color={CART_PALETTE.groundLight} roughness={1} />
    </instancedMesh>
  );
}

function LanewayBackdrop({ snapshot }: CartWorldProps): React.JSX.Element {
  return (
    <group position={[0, 0, -3.45]}>
      <mesh receiveShadow position={[0, 2.3, 0]}>
        <boxGeometry args={[17.5, 4.6, 0.35]} />
        <meshStandardMaterial color={CART_PALETTE.brick} roughness={0.96} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-7.2 + index * 1.8, 2.25 + (index % 2) * 0.45, 0.2]}>
          <boxGeometry args={[1.45, 0.13, 0.08]} />
          <meshStandardMaterial color={CART_PALETTE.brickDark} roughness={1} />
        </mesh>
      ))}
      <mesh castShadow position={[-5.45, 2.45, 0.36]}>
        <boxGeometry args={[2.75, 1.25, 0.16]} />
        <meshStandardMaterial color={CART_PALETTE.wattle} roughness={0.8} />
      </mesh>
      <mesh position={[-5.45, 2.45, 0.46]}>
        <boxGeometry args={[2.15, 0.35, 0.08]} />
        <meshStandardMaterial color={CART_PALETTE.coffee} roughness={0.85} />
      </mesh>
      {snapshot.identity.weather === 'coldSnap' ? (
        <mesh position={[4.9, 2.2, 0.4]}>
          <circleGeometry args={[0.62, 10]} />
          <meshStandardMaterial color="#d8e5e7" emissive="#6d8d94" emissiveIntensity={0.25} />
        </mesh>
      ) : null}
    </group>
  );
}

function AwningStripes({ colour }: { readonly colour: string }): React.JSX.Element {
  return (
    <group position={[-0.4, 1.68, -0.55]}>
      {Array.from({ length: 5 }, (_, index) => (
        <mesh castShadow key={index} position={[-1.9 + index * 0.95, 0.08, 0]}>
          <boxGeometry args={[0.43, 0.17, 2.32]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? colour : CART_PALETTE.cream}
            roughness={0.82}
          />
        </mesh>
      ))}
    </group>
  );
}

function CartWheels(): React.JSX.Element {
  return (
    <group>
      {[-1.45, 1.45].map((x) => (
        <mesh castShadow key={x} position={[x, 0.46, 0.96]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.48, 0.48, 0.22, 10]} />
          <meshStandardMaterial color={CART_PALETTE.coffee} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Equipment({ snapshot }: CartWorldProps): React.JSX.Element {
  const { equipment } = snapshot.operation;
  return (
    <group position={[0, 1.55, 0.05]}>
      <mesh
        castShadow
        position={[-0.2, 0.22, 0]}
        scale={[1 + equipment.espressoMachine * 0.08, 1, 1]}
      >
        <boxGeometry args={[1.25, 0.68, 0.62]} />
        <meshStandardMaterial color={CART_PALETTE.metal} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[-1.1, 0.3, 0]}>
        <cylinderGeometry args={[0.21, 0.3, 0.78, 8]} />
        <meshStandardMaterial color="#3c3430" roughness={0.65} />
      </mesh>
      {equipment.batchBrewer > 0 ? (
        <mesh castShadow position={[0.95, 0.26, 0]}>
          <cylinderGeometry args={[0.28, 0.34, 0.62, 8]} />
          <meshStandardMaterial color="#596e70" roughness={0.55} />
        </mesh>
      ) : null}
      <mesh castShadow position={[1.48, 0.12, 0]} rotation={[0, -0.25, 0]}>
        <boxGeometry args={[0.38 + equipment.pos * 0.08, 0.34, 0.2]} />
        <meshStandardMaterial color="#283a3d" roughness={0.45} />
      </mesh>
      {equipment.refrigeration > 0 ? (
        <mesh castShadow position={[1.65, -0.75, -0.25]}>
          <boxGeometry args={[0.75, 1.05, 0.72]} />
          <meshStandardMaterial color="#9cb5b7" metalness={0.15} roughness={0.55} />
        </mesh>
      ) : null}
    </group>
  );
}

function StreetSign(): React.JSX.Element {
  return (
    <group position={[-3.3, 0, 1.05]} rotation={[0, 0.3, 0]}>
      <mesh castShadow position={[0, 0.72, 0]}>
        <boxGeometry args={[0.85, 1.25, 0.15]} />
        <meshStandardMaterial color={CART_PALETTE.coffee} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.76, 0.09]}>
        <boxGeometry args={[0.58, 0.78, 0.05]} />
        <meshStandardMaterial color={CART_PALETTE.cream} roughness={0.9} />
      </mesh>
    </group>
  );
}

function QueueMarkers({ count }: { readonly count: number }): React.JSX.Element {
  return (
    <group name="queue-markers">
      {Array.from({ length: Math.min(12, count) }, (_, index) => (
        <mesh
          key={index}
          position={[2.7 + Math.min(index, 5) * 0.72, 0.025, 2.35 + Math.floor(index / 6) * 0.78]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.31, 8]} />
          <meshStandardMaterial
            color={index === 0 ? CART_PALETTE.service : CART_PALETTE.cream}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function ServiceCue({ snapshot }: CartWorldProps): React.JSX.Element | null {
  const active = snapshot.service.active;
  if (!active) return null;
  return (
    <group position={[1.32, 1.95, 0.25]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.14, 0.11, 0.28, 8]} />
        <meshStandardMaterial color={CART_PALETTE.cream} roughness={0.7} />
      </mesh>
      <mesh position={[-0.43 + active.progress * 0.86, 0.38, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
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
    <group name="activity-cues" position={[6.1, 0, 1.1]}>
      {hasSale ? (
        <mesh castShadow position={[0, 0.55, 0]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={CART_PALETTE.sale}
            emissive={CART_PALETTE.sale}
            emissiveIntensity={latestType === 'sale' ? 0.65 : 0.2}
          />
        </mesh>
      ) : null}
      {hasWalkaway ? (
        <mesh castShadow position={[0.65, 0.5, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.25, 0.65, 5]} />
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

function Weather({ snapshot }: CartWorldProps): React.JSX.Element {
  if (snapshot.identity.weather === 'sunny') {
    return (
      <mesh position={[5.4, 5.2, -2.7]}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial color="#ffd56b" emissive="#e9a735" emissiveIntensity={0.7} />
      </mesh>
    );
  }
  if (snapshot.identity.weather === 'rainy')
    return <Rain animate={snapshot.presentation.animate} />;
  if (snapshot.identity.weather === 'coldSnap') {
    return (
      <group position={[0, 0.05, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[17, 10]} />
          <meshStandardMaterial color="#b7c9c8" opacity={0.16} transparent />
        </mesh>
      </group>
    );
  }
  return <></>;
}

function Rain({ animate }: { readonly animate: boolean }): React.JSX.Element {
  const rainRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => ({
        x: ((index * 37) % 150) / 10 - 7.5,
        y: 0.8 + ((index * 19) % 50) / 10,
        z: ((index * 23) % 90) / 10 - 3.8,
      })),
    [],
  );
  const update = (elapsed: number): void => {
    if (!rainRef.current) return;
    drops.forEach((drop, index) => {
      const y = animate ? ((drop.y - elapsed * 2.4 + 8) % 5.2) + 0.4 : drop.y;
      dummy.position.set(drop.x, y, drop.z);
      dummy.rotation.set(0, 0, 0.22);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rainRef.current?.setMatrixAt(index, dummy.matrix);
      rainRef.current?.setColorAt(index, new Color('#b9dde0'));
    });
    rainRef.current.instanceMatrix.needsUpdate = true;
    if (rainRef.current.instanceColor) rainRef.current.instanceColor.needsUpdate = true;
  };
  useLayoutEffect(() => update(0));
  useFrame(({ clock }) => {
    if (animate) update(clock.getElapsedTime());
  });
  return (
    <instancedMesh args={[undefined, undefined, drops.length]} count={drops.length} ref={rainRef}>
      <boxGeometry args={[0.035, 0.34, 0.035]} />
      <meshStandardMaterial transparent opacity={0.72} vertexColors />
    </instancedMesh>
  );
}
