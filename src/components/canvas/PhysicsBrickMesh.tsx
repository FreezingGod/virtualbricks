import { useMemo, useRef } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { BrickRegistry, BrickGeometryGenerator } from '@/core/brick'
import { useSceneStore, useUIStore } from '@/store'
import { LEGO_COLORS } from '@/types'
import { LEGO } from '@/core/constants'
import type { BrickInstance } from '@/types'

interface PhysicsBrickMeshProps {
  brick: BrickInstance
  isGrounded: boolean
}

export function PhysicsBrickMesh({ brick, isGrounded }: PhysicsBrickMeshProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const selectBrick = useSceneStore(state => state.selectBrick)
  const removeBrick = useSceneStore(state => state.removeBrick)
  const currentTool = useUIStore(state => state.currentTool)
  const gravityEnabled = useUIStore(state => state.gravityEnabled)

  // Get brick definition
  const definition = useMemo(() => {
    return BrickRegistry.get(brick.definitionId)
  }, [brick.definitionId])

  // Get geometry and material
  const { geometry, material } = useMemo(() => {
    if (!definition) {
      return {
        geometry: new THREE.BoxGeometry(8, 9.6, 8),
        material: new THREE.MeshStandardMaterial({ color: 'red' }),
      }
    }

    const geo = BrickGeometryGenerator.getGeometry(definition)
    const color = LEGO_COLORS[brick.colorId] || LEGO_COLORS[4]

    const mat = new THREE.MeshStandardMaterial({
      color: color.hex,
      roughness: 0.3,
      metalness: 0.0,
      transparent: brick.isGhost || (color.alpha !== undefined),
      opacity: brick.isGhost ? 0.5 : (color.alpha ?? 1),
      side: THREE.DoubleSide,
    })

    return { geometry: geo, material: mat }
  }, [definition, brick.colorId, brick.isGhost])

  // Calculate collider half-extents (Rapier uses half-extents)
  const colliderArgs = useMemo((): [number, number, number] => {
    if (!definition) return [4, 4.8, 4]

    const { width, depth, height } = definition.dimensions
    return [
      (width * LEGO.STUD_SPACING) / 2,
      (height * LEGO.PLATE_HEIGHT) / 2,
      (depth * LEGO.STUD_SPACING) / 2,
    ]
  }, [definition])

  // Collider offset (center of brick body)
  const colliderOffset = useMemo((): [number, number, number] => {
    if (!definition) return [0, 4.8, 0]
    const heightMM = definition.dimensions.height * LEGO.PLATE_HEIGHT
    return [0, heightMM / 2, 0]
  }, [definition])

  // Handle click
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    switch (currentTool) {
      case 'select':
        selectBrick(brick.id, e.shiftKey)
        break
      case 'delete':
        removeBrick(brick.id)
        break
    }
  }

  // Handle pointer over
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }

  // Handle pointer out
  const handlePointerOut = () => {
    document.body.style.cursor = 'auto'
  }

  // Determine if this brick should be fixed (kinematic)
  // Bricks on the ground or connected to grounded bricks are fixed when gravity is off
  const isFixed = !gravityEnabled || isGrounded || brick.position.y <= 0

  return (
    <RigidBody
      ref={rigidBodyRef}
      type={isFixed ? 'fixed' : 'dynamic'}
      position={[brick.position.x, brick.position.y, brick.position.z]}
      rotation={[brick.rotation.x, brick.rotation.y, brick.rotation.z]}
      colliders={false}
      mass={definition?.mass ?? 1}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      {/* Brick mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        {/* Selection highlight */}
        {brick.isSelected && (
          <mesh position={colliderOffset}>
            <boxGeometry args={[
              colliderArgs[0] * 2 + 2,
              colliderArgs[1] * 2 + 2,
              colliderArgs[2] * 2 + 2,
            ]} />
            <meshBasicMaterial
              color="#00aaff"
              transparent
              opacity={0.2}
              depthWrite={false}
            />
          </mesh>
        )}
      </mesh>

      {/* Physics collider */}
      <CuboidCollider
        args={colliderArgs}
        position={colliderOffset}
      />
    </RigidBody>
  )
}
