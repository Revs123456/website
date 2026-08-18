'use client';
import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import FloatingSphere, { SphereConfig } from './FloatingSphere';

const SPHERES: SphereConfig[] = [
  // Glass spheres
  { position: [-3.5, 1.2, 0],    size: 0.9, variant: 'glass',     color: '#a5b4fc', speed: 0.6, floatOffset: 0,    rotSpeed: 0.5 },
  { position: [3.2,  -0.8, -1],  size: 0.7, variant: 'glass',     color: '#93c5fd', speed: 0.8, floatOffset: 1.2,  rotSpeed: 0.7 },
  { position: [0.5,  2.0, -0.5], size: 0.5, variant: 'glass',     color: '#c4b5fd', speed: 1.0, floatOffset: 2.1,  rotSpeed: 0.9 },
  { position: [-1.2,-1.8, -2],   size: 1.1, variant: 'glass',     color: '#bfdbfe', speed: 0.5, floatOffset: 0.8,  rotSpeed: 0.3 },

  // Glossy metallic
  { position: [2.0,  1.5, 0.5],  size: 0.55,variant: 'glossy',    color: '#2563eb', speed: 0.9, floatOffset: 3.0,  rotSpeed: 1.2 },
  { position: [-2.5,-0.5, -3],   size: 1.3, variant: 'glossy',    color: '#7c3aed', speed: 0.4, floatOffset: 1.5,  rotSpeed: 0.4 },
  { position: [4.0,  0.2, -2],   size: 0.65,variant: 'glossy',    color: '#1d4ed8', speed: 0.7, floatOffset: 4.2,  rotSpeed: 0.8 },

  // Wireframe
  { position: [-4.2, 2.0, -2.5], size: 1.4, variant: 'wireframe', color: '#6366f1', speed: 0.3, floatOffset: 0.5,  rotSpeed: 0.6 },
  { position: [1.5, -2.2, -3],   size: 1.0, variant: 'wireframe', color: '#8b5cf6', speed: 0.6, floatOffset: 2.8,  rotSpeed: 0.5 },
  { position: [3.8,  2.5, -1],   size: 0.45,variant: 'wireframe', color: '#60a5fa', speed: 1.1, floatOffset: 1.8,  rotSpeed: 1.0 },

  // Distort
  { position: [-1.0, 0.5, 1],    size: 0.7, variant: 'distort',   color: '#818cf8', speed: 0.75,floatOffset: 3.5,  rotSpeed: 0.6 },
  { position: [0.0, -1.5, -1.5], size: 0.4, variant: 'distort',   color: '#38bdf8', speed: 1.2, floatOffset: 0.3,  rotSpeed: 1.4 },
];

export default function Scene() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Reduce spheres on small screens
  const spheres = viewport.width < 6 ? SPHERES.slice(0, 7) : SPHERES;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]}   intensity={60} color="#ffffff" />
      <pointLight position={[-5, -3, 3]} intensity={40} color="#6366f1" />
      <pointLight position={[0, 8, -2]}  intensity={30} color="#38bdf8" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {spheres.map((cfg, i) => (
        <FloatingSphere key={i} config={cfg} mouseRef={mouseRef} />
      ))}
    </>
  );
}
