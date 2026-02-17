import { BrickRegistry } from '@/core/brick'
import { LEGO } from '@/core/constants'
import type { BrickInstance } from '@/types'

interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

/**
 * Check if rotation is approximately 90° or 270° (swap width/depth)
 */
function isRotated90Degrees(rotationY: number): boolean {
  // Normalize rotation to [0, 2π)
  const normalized = ((rotationY % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  // Check if close to π/2 or 3π/2 (90° or 270°)
  const tolerance = 0.01
  return (
    Math.abs(normalized - Math.PI / 2) < tolerance ||
    Math.abs(normalized - (3 * Math.PI) / 2) < tolerance
  )
}

/**
 * Get the axis-aligned bounding box for a brick
 */
export function getBrickBoundingBox(brick: BrickInstance): BoundingBox | null {
  const definition = BrickRegistry.get(brick.definitionId)
  if (!definition) return null

  const { width, height, depth } = definition.dimensions

  // Handle 90-degree rotations by swapping width and depth
  const rotated = isRotated90Degrees(brick.rotation.y)
  const effectiveWidth = rotated ? depth : width
  const effectiveDepth = rotated ? width : depth

  const halfWidth = (effectiveWidth * LEGO.STUD_SPACING) / 2
  const halfDepth = (effectiveDepth * LEGO.STUD_SPACING) / 2
  const brickHeight = height * LEGO.PLATE_HEIGHT

  return {
    minX: brick.position.x - halfWidth,
    maxX: brick.position.x + halfWidth,
    minY: brick.position.y,
    maxY: brick.position.y + brickHeight,
    minZ: brick.position.z - halfDepth,
    maxZ: brick.position.z + halfDepth,
  }
}

/**
 * Check if two bounding boxes overlap
 */
function boxesOverlap(a: BoundingBox, b: BoundingBox, tolerance: number = 0.1): boolean {
  // Add small tolerance to avoid floating point issues
  return (
    a.minX < b.maxX - tolerance &&
    a.maxX > b.minX + tolerance &&
    a.minY < b.maxY - tolerance &&
    a.maxY > b.minY + tolerance &&
    a.minZ < b.maxZ - tolerance &&
    a.maxZ > b.minZ + tolerance
  )
}

/**
 * Check if a new brick would collide with existing bricks
 */
export function checkCollision(
  newBrick: {
    definitionId: string
    position: { x: number; y: number; z: number }
    rotation?: { x: number; y: number; z: number }
  },
  existingBricks: BrickInstance[],
  excludeId?: string
): boolean {
  const newBrickInstance: BrickInstance = {
    id: 'temp',
    definitionId: newBrick.definitionId,
    position: newBrick.position,
    rotation: newBrick.rotation ?? { x: 0, y: 0, z: 0 },
    colorId: 0,
    isSelected: false,
    isLocked: false,
    isGhost: false,
    connections: [],
    isStatic: false,
  }

  const newBox = getBrickBoundingBox(newBrickInstance)
  if (!newBox) return false

  for (const brick of existingBricks) {
    if (excludeId && brick.id === excludeId) continue

    const existingBox = getBrickBoundingBox(brick)
    if (!existingBox) continue

    if (boxesOverlap(newBox, existingBox)) {
      return true // Collision detected
    }
  }

  return false // No collision
}

/**
 * Find all bricks that collide with a given brick
 */
export function findCollidingBricks(
  newBrick: {
    definitionId: string
    position: { x: number; y: number; z: number }
    rotation?: { x: number; y: number; z: number }
  },
  existingBricks: BrickInstance[],
  excludeId?: string
): BrickInstance[] {
  const colliding: BrickInstance[] = []

  const newBrickInstance: BrickInstance = {
    id: 'temp',
    definitionId: newBrick.definitionId,
    position: newBrick.position,
    rotation: newBrick.rotation ?? { x: 0, y: 0, z: 0 },
    colorId: 0,
    isSelected: false,
    isLocked: false,
    isGhost: false,
    connections: [],
    isStatic: false,
  }

  const newBox = getBrickBoundingBox(newBrickInstance)
  if (!newBox) return colliding

  for (const brick of existingBricks) {
    if (excludeId && brick.id === excludeId) continue

    const existingBox = getBrickBoundingBox(brick)
    if (!existingBox) continue

    if (boxesOverlap(newBox, existingBox)) {
      colliding.push(brick)
    }
  }

  return colliding
}
