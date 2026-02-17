import { BrickRegistry } from '@/core/brick'
import { LEGO } from '@/core/constants'
import type { BrickInstance, BrickDefinition, ConnectionPoint } from '@/types'

export interface SnapResult {
  position: { x: number; y: number; z: number }
  isValid: boolean
  connectedBrickId?: string
  connectionType?: 'top' | 'bottom'  // top = placing on top, bottom = placing below
}

/**
 * Check if rotation is approximately 90° or 270° (swap width/depth)
 */
function isRotated90Degrees(rotationY: number): boolean {
  const normalized = ((rotationY % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const tolerance = 0.01
  return (
    Math.abs(normalized - Math.PI / 2) < tolerance ||
    Math.abs(normalized - (3 * Math.PI) / 2) < tolerance
  )
}

/**
 * Rotate a point around the Y axis
 */
function rotatePointY(x: number, z: number, rotationY: number): { x: number; z: number } {
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  return {
    x: x * cos - z * sin,
    z: x * sin + z * cos,
  }
}

/**
 * Get world position of a connection point on a brick, considering rotation
 */
function getConnectionWorldPosition(
  brick: BrickInstance,
  point: ConnectionPoint
): { x: number; y: number; z: number } {
  // Rotate the local position around Y axis
  const rotated = rotatePointY(point.position.x, point.position.z, brick.rotation.y)
  return {
    x: brick.position.x + rotated.x,
    y: brick.position.y + point.position.y,
    z: brick.position.z + rotated.z,
  }
}

/**
 * Get all stud positions on top of a brick (world coordinates)
 */
export function getBrickStudPositions(brick: BrickInstance): { x: number; y: number; z: number }[] {
  const definition = BrickRegistry.get(brick.definitionId)
  if (!definition) return []

  return definition.connectionPoints
    .filter(p => p.type === 'stud')
    .map(p => getConnectionWorldPosition(brick, p))
}

/**
 * Get all anti-stud positions on bottom of a brick (world coordinates)
 */
export function getBrickAntiStudPositions(brick: BrickInstance): { x: number; y: number; z: number }[] {
  const definition = BrickRegistry.get(brick.definitionId)
  if (!definition) return []

  return definition.connectionPoints
    .filter(p => p.type === 'anti_stud')
    .map(p => getConnectionWorldPosition(brick, p))
}

/**
 * Check if a new brick can snap to existing bricks
 * Returns the best snap position if found
 *
 * Key insight: Only allow snapping when Y positions are compatible.
 * - When placing at ground level (roughPosition.y ≈ 0), don't snap to positions on top of other bricks
 * - When placing on top of a brick (roughPosition.y > threshold), allow stacking snaps
 */
export function findSnapPosition(
  newBrickDef: BrickDefinition,
  roughPosition: { x: number; y: number; z: number },
  existingBricks: BrickInstance[],
  snapDistance: number = LEGO.STUD_SPACING * 1.5,
  rotationY: number = 0
): SnapResult {
  // Get the anti-studs of the new brick (relative positions)
  const newAntiStuds = newBrickDef.connectionPoints.filter(p => p.type === 'anti_stud')
  const newStuds = newBrickDef.connectionPoints.filter(p => p.type === 'stud')

  let bestSnap: SnapResult = {
    position: roughPosition,
    isValid: false,
  }
  let bestDistance = Infinity

  // Maximum Y difference allowed for snapping
  // This must be small enough to prevent ground-level placements from snapping to brick tops
  // Use STUD_HEIGHT (1.6mm) as tolerance - this allows for minor raycasting imprecision
  // but prevents snapping to a different Y level
  const maxYDelta = LEGO.STUD_HEIGHT

  // Try to snap new brick's anti-studs to existing brick's studs (placing on top)
  for (const existingBrick of existingBricks) {
    const existingStuds = getBrickStudPositions(existingBrick)

    for (const existingStud of existingStuds) {
      for (const newAntiStud of newAntiStuds) {
        // Rotate the anti-stud's local position to get its rotated offset
        const rotatedOffset = rotatePointY(newAntiStud.position.x, newAntiStud.position.z, rotationY)

        // Calculate where the new brick would need to be for this connection
        // The new brick's bottom (anti-stud) should align with the existing brick's top (stud)
        // No need to add STUD_HEIGHT - the stud inserts into the anti-stud cavity
        const snapPos = {
          x: existingStud.x - rotatedOffset.x,
          y: existingStud.y - newAntiStud.position.y,
          z: existingStud.z - rotatedOffset.z,
        }

        // Check Y delta - only allow snap if Y positions are compatible
        const yDelta = Math.abs(snapPos.y - roughPosition.y)
        if (yDelta > maxYDelta) {
          continue // Skip this snap - Y positions too different
        }

        // Check XZ distance (horizontal distance)
        const dx = snapPos.x - roughPosition.x
        const dz = snapPos.z - roughPosition.z
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz)

        if (horizontalDistance < snapDistance && horizontalDistance < bestDistance) {
          // Check if ALL anti-studs would align with studs at this position
          const allAligned = checkAllStudsAlign(newBrickDef, snapPos, existingBricks, rotationY)

          if (allAligned) {
            bestDistance = horizontalDistance
            bestSnap = {
              position: snapPos,
              isValid: true,
              connectedBrickId: existingBrick.id,
              connectionType: 'top',
            }
          }
        }
      }
    }
  }

  // Try to snap new brick's studs to existing brick's anti-studs (placing below)
  for (const existingBrick of existingBricks) {
    const existingAntiStuds = getBrickAntiStudPositions(existingBrick)

    for (const existingAntiStud of existingAntiStuds) {
      for (const newStud of newStuds) {
        // Rotate the stud's local position to get its rotated offset
        const rotatedOffset = rotatePointY(newStud.position.x, newStud.position.z, rotationY)

        // Calculate where the new brick would need to be for this connection
        const snapPos = {
          x: existingAntiStud.x - rotatedOffset.x,
          y: existingAntiStud.y - newStud.position.y - LEGO.STUD_HEIGHT,
          z: existingAntiStud.z - rotatedOffset.z,
        }

        // Check Y delta
        const yDelta = Math.abs(snapPos.y - roughPosition.y)
        if (yDelta > maxYDelta) {
          continue
        }

        // Check XZ distance (horizontal distance)
        const dx = snapPos.x - roughPosition.x
        const dz = snapPos.z - roughPosition.z
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz)

        if (horizontalDistance < snapDistance && horizontalDistance < bestDistance) {
          bestDistance = horizontalDistance
          bestSnap = {
            position: snapPos,
            isValid: true,
            connectedBrickId: existingBrick.id,
            connectionType: 'bottom',
          }
        }
      }
    }
  }

  return bestSnap
}

/**
 * Check if all anti-studs of a brick at a given position would align with existing studs
 */
function checkAllStudsAlign(
  brickDef: BrickDefinition,
  position: { x: number; y: number; z: number },
  existingBricks: BrickInstance[],
  rotationY: number = 0
): boolean {
  const antiStuds = brickDef.connectionPoints.filter(p => p.type === 'anti_stud')

  // Collect all existing stud positions
  const allStudPositions: { x: number; y: number; z: number }[] = []
  for (const brick of existingBricks) {
    allStudPositions.push(...getBrickStudPositions(brick))
  }

  // Check each anti-stud
  let alignedCount = 0
  const tolerance = 0.5 // mm

  for (const antiStud of antiStuds) {
    // Rotate the anti-stud position
    const rotatedOffset = rotatePointY(antiStud.position.x, antiStud.position.z, rotationY)
    const worldPos = {
      x: position.x + rotatedOffset.x,
      y: position.y + antiStud.position.y,
      z: position.z + rotatedOffset.z,
    }

    // Check if there's a stud at this position (with tolerance)
    // Anti-stud y position should match stud y position (stud inserts into cavity)
    for (const studPos of allStudPositions) {
      const dx = Math.abs(worldPos.x - studPos.x)
      const dy = Math.abs(worldPos.y - studPos.y)
      const dz = Math.abs(worldPos.z - studPos.z)

      if (dx < tolerance && dy < tolerance && dz < tolerance) {
        alignedCount++
        break
      }
    }
  }

  // At least one anti-stud must align (partial connections are OK)
  return alignedCount > 0
}

/**
 * Snap position to the LEGO grid with proper stud alignment
 *
 * LEGO studs must align for bricks to connect. This requires:
 * - Even stud counts (2, 4, 6...): center offset by half stud (4mm)
 * - Odd stud counts (1, 3, 5...): center on grid
 *
 * This ensures all brick studs align to a universal stud grid.
 */
export function snapToGridWithDimensions(
  position: { x: number; y: number; z: number },
  widthStuds: number,
  depthStuds: number,
  rotationY: number = 0
): { x: number; y: number; z: number } {
  const halfStud = LEGO.STUD_SPACING / 2

  // Handle 90-degree rotations by swapping width and depth
  const rotated = isRotated90Degrees(rotationY)
  const effectiveWidth = rotated ? depthStuds : widthStuds
  const effectiveDepth = rotated ? widthStuds : depthStuds

  // For even stud counts, center is between studs (offset by 4mm)
  // For odd stud counts, center is on a stud (no offset)
  const xOffset = effectiveWidth % 2 === 0 ? halfStud : 0
  const zOffset = effectiveDepth % 2 === 0 ? halfStud : 0

  return {
    x: Math.round((position.x - xOffset) / LEGO.STUD_SPACING) * LEGO.STUD_SPACING + xOffset,
    y: Math.round(position.y / LEGO.PLATE_HEIGHT) * LEGO.PLATE_HEIGHT,
    z: Math.round((position.z - zOffset) / LEGO.STUD_SPACING) * LEGO.STUD_SPACING + zOffset,
  }
}
