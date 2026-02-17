import { useEffect, useMemo } from 'react'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useSceneStore, useUIStore } from '@/store'
import { connectionManager } from '@/core/physics'
import { PhysicsBrickMesh } from './PhysicsBrickMesh'
import { BrickMesh } from './BrickMesh'

export function PhysicsBrickScene() {
  const bricks = useSceneStore(state => state.bricks)
  const physicsEnabled = useUIStore(state => state.physicsEnabled)
  const gravityEnabled = useUIStore(state => state.gravityEnabled)
  const showPhysicsDebug = useUIStore(state => state.showPhysicsDebug)

  // Update connections when bricks change
  useEffect(() => {
    const brickArray = Array.from(bricks.values())

    // Clear and rebuild connections
    connectionManager.clear()

    for (const brick of brickArray) {
      const otherBricks = brickArray.filter(b => b.id !== brick.id)
      const candidates = connectionManager.findConnections(brick, otherBricks)
      connectionManager.createConnections(candidates)
    }
  }, [bricks])

  // Calculate grounded state for each brick
  const groundedBricks = useMemo(() => {
    const grounded = new Set<string>()

    for (const brick of bricks.values()) {
      if (connectionManager.isGrounded(brick.id, bricks)) {
        grounded.add(brick.id)
      }
    }

    return grounded
  }, [bricks])

  // If physics is disabled, render regular bricks
  if (!physicsEnabled) {
    return (
      <group name="brick-scene">
        {Array.from(bricks.values()).map(brick => (
          <BrickMesh key={brick.id} brick={brick} />
        ))}
      </group>
    )
  }

  // Render with physics
  // Note: gravity is in m/s², but our units are mm, so scale appropriately
  // 9.81 m/s² = 9810 mm/s²
  return (
    <Physics
      gravity={gravityEnabled ? [0, -9810, 0] : [0, 0, 0]}
      debug={showPhysicsDebug}
    >
      <group name="brick-scene">
        {Array.from(bricks.values()).map(brick => (
          <PhysicsBrickMesh
            key={brick.id}
            brick={brick}
            isGrounded={groundedBricks.has(brick.id)}
          />
        ))}
      </group>

      {/* Ground plane collider */}
      <GroundPlane />
    </Physics>
  )
}

function GroundPlane() {
  return (
    <RigidBody type="fixed" position={[0, -5, 0]}>
      <CuboidCollider args={[500, 5, 500]} />
    </RigidBody>
  )
}
