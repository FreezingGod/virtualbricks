import { useMemo, useRef } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BrickRegistry, BrickGeometryGenerator } from '@/core/brick'
import { useSceneStore, useUIStore } from '@/store'
import { LEGO_COLORS } from '@/types'
import type { BrickInstance } from '@/types'

interface BrickMeshProps {
  brick: BrickInstance
}

export function BrickMesh({ brick }: BrickMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const selectBrick = useSceneStore(state => state.selectBrick)
  const removeBrick = useSceneStore(state => state.removeBrick)
  const currentTool = useUIStore(state => state.currentTool)

  // Get brick definition and geometry
  const { geometry, material } = useMemo(() => {
    const definition = BrickRegistry.get(brick.definitionId)
    if (!definition) {
      console.warn(`Unknown brick definition: ${brick.definitionId}`)
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
    })

    return { geometry: geo, material: mat }
  }, [brick.definitionId, brick.colorId, brick.isGhost])

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
    if (meshRef.current) {
      document.body.style.cursor = 'pointer'
    }
  }

  // Handle pointer out
  const handlePointerOut = () => {
    document.body.style.cursor = 'auto'
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[brick.position.x, brick.position.y, brick.position.z]}
      rotation={[brick.rotation.x, brick.rotation.y, brick.rotation.z]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      castShadow
      receiveShadow
    >
      {/* Selection highlight */}
      {brick.isSelected && (
        <mesh>
          <boxGeometry args={[
            geometry.boundingBox?.max.x ? (geometry.boundingBox.max.x - geometry.boundingBox.min.x) + 2 : 10,
            geometry.boundingBox?.max.y ? (geometry.boundingBox.max.y - geometry.boundingBox.min.y) + 2 : 12,
            geometry.boundingBox?.max.z ? (geometry.boundingBox.max.z - geometry.boundingBox.min.z) + 2 : 10,
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
  )
}
