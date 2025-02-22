import React from 'react';
import * as THREE from 'three';

interface PlayerModelProps {
  playerId: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isShooting?: boolean;
}

// Export the player model
export default function PlayerModel({ playerId, position, rotation, isShooting = false }: PlayerModelProps) {
  return (
    <group position={position} rotation={rotation} userData={{ isPlayer: true, playerId }}>
      {/* Player body */}
      <mesh position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial color="#ff4444" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Player gun */}
      <group position={[0.3, 1.2, -0.3]} rotation={[0, rotation.y, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.4]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Muzzle flash for remote player */}
        {isShooting && (
          <mesh position={[0, 0, -0.45]}>
            <coneGeometry args={[0.05, 0.1, 8]} />
            <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
          </mesh>
        )}
      </group>
    </group>
  );
}
