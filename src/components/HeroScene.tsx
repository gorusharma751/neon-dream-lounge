import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';

function FloatingGeo({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.3;
    ref.current.rotation.y = Math.cos(state.clock.elapsedTime * speed * 0.7) * 0.3;
  });
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={ref} position={position}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} wireframe transparent opacity={0.4} />
      </mesh>
    </Float>
  );
}

function Particles({ count = 80 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.02;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#00d4ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function CameraRig() {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 0.5, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 0.3 + 1, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 1, 6], fov: 60 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#00d4ff" />
          <pointLight position={[-5, -5, 5]} intensity={0.3} color="#a855f7" />

          <FloatingGeo position={[-3, 1, -2]} color="#00d4ff" speed={1.2} />
          <FloatingGeo position={[3, -1, -3]} color="#a855f7" speed={0.8} />
          <FloatingGeo position={[0, 2, -4]} color="#00d4ff" speed={1} />
          <FloatingGeo position={[-2, -2, -1]} color="#a855f7" speed={1.5} />
          <FloatingGeo position={[2, 0.5, -2]} color="#22d3ee" speed={0.6} />

          <Particles count={80} />
          <Stars radius={50} depth={50} count={200} factor={2} saturation={0} fade speed={0.5} />
          <CameraRig />
        </Suspense>
      </Canvas>
    </div>
  );
}
