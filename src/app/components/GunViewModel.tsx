import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GunViewModelProps {
  isAiming: boolean;
  muzzleFlash?: boolean;
}

export default function GunViewModel({ isAiming, muzzleFlash }: GunViewModelProps) {
  const gunMesh = useRef<THREE.Group>(null);
  const targetPosition = new THREE.Vector3(0, -0.3, -0.5);
  const aimPosition = new THREE.Vector3(0, -0.2, -0.4);

  useFrame(() => {
    if (!gunMesh.current) return;
    const target = isAiming ? aimPosition : targetPosition;
    gunMesh.current.position.lerp(target, 0.3);
  });

  // Return the mesh/model (i think - ploszukiwacz)
  return (
    <group ref={gunMesh} position={[0, -0.3, -0.5]} rotation={[0, 0, 0]}>
      {/* Mesh */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.35]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, -0.15, 0.1]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, -0.12, 0.1]}>
        <boxGeometry args={[0.07, 0.15, 0.08]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, 0.02, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.3, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, 0.08, -0.15]}>
        <boxGeometry args={[0.02, 0.04, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, 0.08, 0.1]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0.05, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.02, 0.05, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, -0.02, -0.15]}>
        <boxGeometry args={[0.085, 0.06, 0.15]} />
        <meshStandardMaterial color="#252525" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Mesh */}
      <mesh position={[0, 0.02, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.05, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Muzzle flash effect */}
      {muzzleFlash && (
        <mesh position={[0, 0.02, -0.35]}>
          <coneGeometry args={[0.05, 0.1, 8]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
