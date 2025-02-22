import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface TargetProps {
  position: [number, number, number];
}

export default function Target({ position }: TargetProps) {
  const [hit, setHit] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (hit) {
      const timer = setTimeout(() => setHit(false), 200);
      return () => clearTimeout(timer);
    }
  }, [hit]);

  // Return mesh (very usefull comments ik - ploszukiwacz)
  return (
    <mesh
      ref={meshRef}
      position={position}
      userData={{ isTarget: true, onHit: () => setHit(true) }}
    >
      <boxGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial
        color={hit ? "#ff0000" : "#00ff00"}
        emissive={hit ? "#ff0000" : "#00ff00"}
        emissiveIntensity={hit ? 1 : 0.2}
      />
    </mesh>
  );
}
