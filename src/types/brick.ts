import type { BufferGeometry } from 'three'

/**
 * Brick category classification
 */
export type BrickCategory =
  | 'basic'       // Basic bricks, plates, tiles
  | 'slope'       // Slopes and ramps
  | 'round'       // Round bricks, plates, cones
  | 'technic'     // Technic beams, pins, axles
  | 'special'     // Special elements
  | 'minifig'     // Minifigure parts
  | 'decoration'  // Decorative elements

/**
 * Brick shape types for geometry generation
 */
export type BrickShape =
  | 'box'         // Standard rectangular brick
  | 'slope'       // Sloped brick (specify angle in shapeParams)
  | 'slope_inverted' // Inverted slope
  | 'round'       // Round brick/plate (1x1 round)
  | 'cylinder'    // Cylindrical brick
  | 'cone'        // Cone shaped
  | 'wedge'       // Wedge shaped
  | 'arch'        // Arch brick

/**
 * Shape-specific parameters
 */
export interface ShapeParams {
  // For slopes: angle in degrees (33, 45, 65, etc.)
  slopeAngle?: number
  // For slopes: direction ('front', 'back', 'left', 'right')
  slopeDirection?: 'front' | 'back' | 'left' | 'right'
  // For round/cylinder: whether it's hollow
  hollow?: boolean
  // For arch: inner radius in studs
  archInnerRadius?: number
}

/**
 * Connection point types
 */
export type ConnectionPointType =
  | 'stud'        // Male connector (top of brick)
  | 'anti_stud'   // Female connector (bottom of brick)
  | 'axle_hole'   // Technic axle hole
  | 'pin_hole'    // Technic pin hole
  | 'axle'        // Technic axle (male)
  | 'pin'         // Technic pin (male)

/**
 * Connection point definition
 */
export interface ConnectionPoint {
  type: ConnectionPointType
  position: { x: number; y: number; z: number }  // Relative to brick origin (mm)
  direction: { x: number; y: number; z: number } // Normal direction
  size?: number // For holes/axles: diameter
}

/**
 * Collider shape for physics
 */
export interface ColliderShape {
  type: 'cuboid' | 'cylinder' | 'convexHull'
  halfExtents?: { x: number; y: number; z: number }  // For cuboid
  radius?: number      // For cylinder
  height?: number      // For cylinder
  vertices?: number[]  // For convexHull
  offset?: { x: number; y: number; z: number }
}

/**
 * Static brick definition (shared between all instances of same type)
 */
export interface BrickDefinition {
  id: string                    // Internal ID
  ldrawId: string               // LDraw part number (e.g., "3001.dat")
  name: string                  // Display name
  category: BrickCategory

  // Shape type for geometry generation (defaults to 'box')
  shape?: BrickShape
  shapeParams?: ShapeParams

  // Dimensions in stud units and plate heights
  dimensions: {
    width: number   // Studs (X axis)
    height: number  // Plates (Y axis, 1 brick = 3 plates)
    depth: number   // Studs (Z axis)
  }

  // Connection points
  connectionPoints: ConnectionPoint[]

  // Collider shapes for physics
  colliderShapes: ColliderShape[]

  // Optional cached geometry
  geometry?: BufferGeometry

  // Physical properties
  mass?: number           // Grams
  centerOfMass?: { x: number; y: number; z: number }
}

/**
 * Runtime brick instance in the scene
 */
export interface BrickInstance {
  id: string                    // Unique instance ID
  definitionId: string          // Reference to BrickDefinition

  // Transform (in mm for position)
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }  // Euler angles (radians)

  // Appearance
  colorId: number               // Reference to LegoColor

  // State
  isSelected: boolean
  isLocked: boolean
  isGhost: boolean              // Preview/translucent state

  // Connections (IDs of connected bricks)
  connections: string[]

  // Physics state
  isStatic: boolean

  // Build step
  stepIndex?: number

  // Grouping
  groupId?: string
}

/**
 * Simplified brick data for serialization
 */
export interface BrickData {
  id: string
  definitionId: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  colorId: number
  stepIndex?: number
  groupId?: string
}
