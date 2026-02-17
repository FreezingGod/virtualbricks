import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { PhysicsBrickScene } from './PhysicsBrickScene'
import { GhostBrick } from './GhostBrick'
import { useUIStore } from '@/store'

export function LegoCanvas() {
  const showGrid = useUIStore(state => state.showGrid)

  return (
    <Canvas
      camera={{
        position: [100, 80, 100],
        fov: 50,
        near: 0.1,
        far: 10000,
      }}
      shadows
      style={{ background: '#f8f8f8' }}
    >
      <Suspense fallback={null}>
        {/* Lighting - toned down for realistic toy appearance */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[50, 100, 50]}
          intensity={0.7}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={500}
          shadow-camera-left={-200}
          shadow-camera-right={200}
          shadow-camera-top={200}
          shadow-camera-bottom={-200}
        />

        {/* Environment for subtle reflections */}
        <Environment preset="apartment" />

        {/* Grid floor */}
        {showGrid && (
          <Grid
            position={[0, 0, 0]}
            args={[400, 400]}
            cellSize={8}
            cellThickness={0.5}
            cellColor="#6f6f6f"
            sectionSize={32}
            sectionThickness={1}
            sectionColor="#9d4b4b"
            fadeDistance={500}
            fadeStrength={1}
            followCamera={false}
          />
        )}

        {/* Base plate representation */}
        <mesh
          position={[0, -0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#707070" />
        </mesh>

        {/* All bricks in the scene (with optional physics) */}
        <PhysicsBrickScene />

        {/* Ghost brick for placement preview */}
        <GhostBrick />

        {/* Camera controls */}
        <OrbitControls
          makeDefault
          minDistance={20}
          maxDistance={500}
          enableDamping
          dampingFactor={0.05}
          target={[0, 0, 0]}
        />
      </Suspense>
    </Canvas>
  )
}
