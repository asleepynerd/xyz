import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BulletProps {
  start: THREE.Vector3;
  direction: THREE.Vector3;
  onHit: () => void;
}

export default function Bullet({ start, direction, onHit }: BulletProps) {
  const bulletRef = useRef<THREE.Mesh>(null);
  const velocity = direction.clone().multiplyScalar(3);
  const [isDead, setIsDead] = useState(false);

  useFrame(({ scene }) => {
    if (!bulletRef.current || isDead) return;

    bulletRef.current.position.add(velocity);

    const raycaster = new THREE.Raycaster(
      bulletRef.current.position.clone(),
      direction.clone().normalize(),
      0,
      1
    );

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.object.userData.isTarget) {
        hit.object.userData.onHit();
        setIsDead(true);
        onHit();
      }
    }
  });

  if (isDead) return null;

  return (
    <mesh ref={bulletRef} position={start}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshStandardMaterial
        color="#ADD8E6" // change it to a light blue because why not
        emissive="#ffff00" // we'll keep this the same because we ballin'
        emissiveIntensity={2}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
}
