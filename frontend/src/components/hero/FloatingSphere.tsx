'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export type SphereConfig = {
  position: [number, number, number];
  size: number;
  variant: 'glass' | 'wireframe' | 'glossy' | 'distort';
  color: string;
  speed: number;
  floatOffset: number;
  rotSpeed: number;
};

export default function FloatingSphere({ config, mouseRef }: {
  config: SphereConfig;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  const { position, size, variant, color, speed, floatOffset, rotSpeed } = config;
  const depth = position[2]; // z-depth drives parallax strength

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Organic float
    const floatY = Math.sin(t * speed + floatOffset) * 0.3;
    const floatX = Math.cos(t * speed * 0.7 + floatOffset) * 0.12;

    // Parallax — objects closer (higher z) move more
    const parallaxStrength = THREE.MathUtils.mapLinear(depth, -4, 2, 0.05, 0.25);
    const px = mouseRef.current.x * parallaxStrength;
    const py = mouseRef.current.y * parallaxStrength;

    groupRef.current.position.set(
      position[0] + floatX + px,
      position[1] + floatY + py,
      position[2]
    );

    // Slow rotation
    meshRef.current.rotation.x += rotSpeed * 0.008;
    meshRef.current.rotation.y += rotSpeed * 0.012;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, variant === 'wireframe' ? 16 : 64, 64]} />

        {variant === 'glass' && (
          <MeshTransmissionMaterial
            transmission={0.95}
            roughness={0.05}
            thickness={0.8}
            ior={1.5}
            chromaticAberration={0.04}
            color={color}
            backside
          />
        )}

        {variant === 'wireframe' && (
          <meshBasicMaterial
            color={color}
            wireframe
            opacity={0.35}
            transparent
          />
        )}

        {variant === 'glossy' && (
          <meshStandardMaterial
            color={color}
            metalness={0.9}
            roughness={0.08}
            envMapIntensity={1.5}
          />
        )}

        {variant === 'distort' && (
          <MeshDistortMaterial
            color={color}
            distort={0.35}
            speed={1.5}
            roughness={0.1}
            metalness={0.4}
            transparent
            opacity={0.82}
          />
        )}
      </mesh>
    </group>
  );
}
