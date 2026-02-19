import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BrickRegistry, BrickGeometryGenerator } from '@/core/brick'
import { checkCollision } from '@/core/collision'
import { findSnapPosition, snapToGridWithDimensions } from '@/core/connection'
import { useSceneStore, useUIStore } from '@/store'
import { LEGO_COLORS } from '@/types'
import { LEGO } from '@/core/constants'

export function GhostBrick() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const groundPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const [hasCollision, setHasCollision] = useState(false)
  const isSnappedRef = useRef(false)
  const ghostRotationYRef = useRef(0)

  const { camera, raycaster, pointer, scene } = useThree()

  const currentTool = useUIStore(state => state.currentTool)
  const selectedDefinitionId = useUIStore(state => state.selectedDefinitionId)
  const selectedColorId = useUIStore(state => state.selectedColorId)
  const ghostRotationY = useUIStore(state => state.ghostRotationY)
  const rotateGhost = useUIStore(state => state.rotateGhost)
  const addBrick = useSceneStore(state => state.addBrick)
  const bricks = useSceneStore(state => state.bricks)

  // Get geometry and definition for ghost brick
  const { geometry, definition } = useMemo(() => {
    if (!selectedDefinitionId) return { geometry: null, definition: null }

    const def = BrickRegistry.get(selectedDefinitionId)
    if (!def) return { geometry: null, definition: null }

    return { geometry: BrickGeometryGenerator.getGeometry(def), definition: def }
  }, [selectedDefinitionId])

  // Create material (will be updated based on collision state)
  const material = useMemo(() => {
    const color = LEGO_COLORS[selectedColorId] || LEGO_COLORS[4]

    const mat = new THREE.MeshStandardMaterial({
      color: color.hex,
      roughness: 0.3,
      metalness: 0.0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })

    materialRef.current = mat
    return mat
  }, [selectedColorId])

  // Keep ref in sync with state for use in click handler
  useEffect(() => {
    ghostRotationYRef.current = ghostRotationY
  }, [ghostRotationY])

  // Keyboard listener for 'R' key to rotate ghost brick
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (currentTool === 'place') {
          rotateGhost()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTool, rotateGhost])

  // Update position and collision state on each frame
  useFrame(() => {
    if (currentTool !== 'place' || !meshRef.current || !geometry || !selectedDefinitionId || !definition) {
      if (meshRef.current) {
        meshRef.current.visible = false
      }
      return
    }

    meshRef.current.visible = true

    // Cast ray from camera
    raycaster.setFromCamera(pointer, camera)

    // Find the brick-scene group and get all brick meshes
    const brickSceneGroup = scene.getObjectByName('brick-scene')
    let roughPosition: { x: number; y: number; z: number } | null = null

    if (brickSceneGroup) {
      // Get all mesh children (bricks)
      const brickMeshes: THREE.Object3D[] = []
      brickSceneGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child !== meshRef.current) {
          brickMeshes.push(child)
        }
      })

      // Raycast against existing bricks
      const intersects = raycaster.intersectObjects(brickMeshes, false)

      if (intersects.length > 0) {
        const hit = intersects[0]
        const hitMesh = hit.object as THREE.Mesh

        hitMesh.geometry.computeBoundingBox()
        const bbox = hitMesh.geometry.boundingBox

        if (bbox) {
          // Intuitive placement: when you click on any part of a brick,
          // you want to place the new brick on TOP of that brick.
          // This makes stacking tall structures much easier.
          const worldTop = hitMesh.position.y + bbox.max.y - LEGO.STUD_HEIGHT
          roughPosition = {
            x: hit.point.x,
            y: worldTop,
            z: hit.point.z,
          }
        }
      }
    }

    // If no brick was hit, use ground plane
    if (!roughPosition) {
      const groundIntersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(groundPlaneRef.current, groundIntersection)
      if (groundIntersection) {
        roughPosition = {
          x: groundIntersection.x,
          y: 0,
          z: groundIntersection.z,
        }
      }
    }

    if (roughPosition) {
      const existingBricks = Array.from(bricks.values())
      let finalPosition: { x: number; y: number; z: number }
      let snapped = false

      // Try to find a snap position (啮合)
      if (existingBricks.length > 0) {
        const snapResult = findSnapPosition(definition, roughPosition, existingBricks, LEGO.STUD_SPACING * 1.5, ghostRotationY)

        if (snapResult.isValid) {
          finalPosition = snapResult.position
          snapped = true
        } else {
          // No snap found, use grid alignment
          finalPosition = snapToGridWithDimensions(
            roughPosition,
            definition.dimensions.width,
            definition.dimensions.depth,
            ghostRotationY
          )
        }
      } else {
        // No existing bricks, use grid alignment
        finalPosition = snapToGridWithDimensions(
          roughPosition,
          definition.dimensions.width,
          definition.dimensions.depth,
          ghostRotationY
        )
      }

      meshRef.current.position.set(finalPosition.x, finalPosition.y, finalPosition.z)
      meshRef.current.rotation.set(0, ghostRotationY, 0)
      isSnappedRef.current = snapped

      // Check collision
      const collision = checkCollision(
        { definitionId: selectedDefinitionId, position: finalPosition, rotation: { x: 0, y: ghostRotationY, z: 0 } },
        existingBricks
      )

      // Update material color based on state
      if (materialRef.current) {
        if (collision) {
          materialRef.current.color.setHex(0xff0000) // Red for collision
          materialRef.current.opacity = 0.6
        } else if (isSnappedRef.current) {
          materialRef.current.color.setHex(0x00ff00) // Green for valid snap
          materialRef.current.opacity = 0.7
        } else {
          const color = LEGO_COLORS[selectedColorId] || LEGO_COLORS[4]
          materialRef.current.color.set(color.hex)
          materialRef.current.opacity = 0.5
        }
      }

      setHasCollision(collision)
    }
  })

  // Handle click to place brick
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    if (currentTool !== 'place' || !meshRef.current || !selectedDefinitionId) return

    // Don't place if there's a collision
    if (hasCollision) {
      console.warn('Cannot place brick: collision detected')
      return
    }

    const position = {
      x: meshRef.current.position.x,
      y: meshRef.current.position.y,
      z: meshRef.current.position.z,
    }

    // Use ref to get the latest rotation value (avoids stale closure)
    const rotation = {
      x: 0,
      y: ghostRotationYRef.current,
      z: 0,
    }

    addBrick(selectedDefinitionId, position, selectedColorId, rotation)
  }

  if (!geometry || !material) return null

  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={handleClick}
        visible={false}
      />
      {/* Invisible plane for ground raycasting and click handling */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={handleClick}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  )
}
