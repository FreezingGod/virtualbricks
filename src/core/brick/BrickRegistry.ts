import type { BrickDefinition, ConnectionPoint, ColliderShape } from '@/types'
import { LEGO } from '@/core/constants'

/**
 * Registry of all available brick definitions
 */
class BrickRegistryClass {
  private definitions: Map<string, BrickDefinition> = new Map()

  constructor() {
    this.registerDefaultBricks()
  }

  /**
   * Register a brick definition
   */
  register(definition: BrickDefinition): void {
    this.definitions.set(definition.id, definition)
  }

  /**
   * Get a brick definition by ID
   */
  get(id: string): BrickDefinition | undefined {
    return this.definitions.get(id)
  }

  /**
   * Get all brick definitions
   */
  getAll(): BrickDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * Get brick definitions by category
   */
  getByCategory(category: string): BrickDefinition[] {
    return this.getAll().filter(def => def.category === category)
  }

  /**
   * Generate standard connection points for a basic brick/plate
   */
  private generateStudConnections(
    width: number,
    depth: number,
    height: number
  ): ConnectionPoint[] {
    const points: ConnectionPoint[] = []
    const heightMM = height * LEGO.PLATE_HEIGHT

    // Top studs
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        points.push({
          type: 'stud',
          position: {
            x: (x + 0.5 - width / 2) * LEGO.STUD_SPACING,
            y: heightMM,
            z: (z + 0.5 - depth / 2) * LEGO.STUD_SPACING,
          },
          direction: { x: 0, y: 1, z: 0 },
        })
      }
    }

    // Bottom anti-studs
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        points.push({
          type: 'anti_stud',
          position: {
            x: (x + 0.5 - width / 2) * LEGO.STUD_SPACING,
            y: 0,
            z: (z + 0.5 - depth / 2) * LEGO.STUD_SPACING,
          },
          direction: { x: 0, y: -1, z: 0 },
        })
      }
    }

    return points
  }

  /**
   * Generate collider shapes for a basic brick
   */
  private generateBasicCollider(
    width: number,
    depth: number,
    height: number
  ): ColliderShape[] {
    const widthMM = width * LEGO.STUD_SPACING
    const depthMM = depth * LEGO.STUD_SPACING
    const heightMM = height * LEGO.PLATE_HEIGHT

    return [
      {
        type: 'cuboid',
        halfExtents: {
          x: widthMM / 2,
          y: heightMM / 2,
          z: depthMM / 2,
        },
        offset: {
          x: 0,
          y: heightMM / 2,
          z: 0,
        },
      },
    ]
  }

  /**
   * Create a basic brick definition
   */
  private createBasicBrick(
    id: string,
    ldrawId: string,
    name: string,
    width: number,
    depth: number,
    heightInPlates: number
  ): BrickDefinition {
    return {
      id,
      ldrawId,
      name,
      category: 'basic',
      dimensions: {
        width,
        depth,
        height: heightInPlates,
      },
      connectionPoints: this.generateStudConnections(width, depth, heightInPlates),
      colliderShapes: this.generateBasicCollider(width, depth, heightInPlates),
      mass: width * depth * heightInPlates * 0.5, // Approximate mass in grams
    }
  }

  /**
   * Create a slope brick definition
   */
  private createSlopeBrick(
    id: string,
    ldrawId: string,
    name: string,
    width: number,
    depth: number,
    heightInPlates: number,
    slopeAngle: number,
    slopeDirection: 'front' | 'back' | 'left' | 'right' = 'front'
  ): BrickDefinition {
    return {
      id,
      ldrawId,
      name,
      category: 'slope',
      shape: 'slope',
      shapeParams: {
        slopeAngle,
        slopeDirection,
      },
      dimensions: {
        width,
        depth,
        height: heightInPlates,
      },
      connectionPoints: this.generateSlopeConnections(width, depth, heightInPlates, slopeDirection),
      colliderShapes: this.generateBasicCollider(width, depth, heightInPlates),
      mass: width * depth * heightInPlates * 0.4, // Slightly less mass due to slope
    }
  }

  /**
   * Generate connection points for slope bricks (studs only on flat areas)
   */
  private generateSlopeConnections(
    width: number,
    depth: number,
    height: number,
    direction: 'front' | 'back' | 'left' | 'right'
  ): ConnectionPoint[] {
    const points: ConnectionPoint[] = []
    const heightMM = height * LEGO.PLATE_HEIGHT

    // Top studs only on flat area (back row for front-facing slope)
    if (direction === 'front') {
      for (let x = 0; x < width; x++) {
        points.push({
          type: 'stud',
          position: {
            x: (x + 0.5 - width / 2) * LEGO.STUD_SPACING,
            y: heightMM,
            z: (0.5 - depth / 2) * LEGO.STUD_SPACING,
          },
          direction: { x: 0, y: 1, z: 0 },
        })
      }
    } else if (direction === 'back') {
      for (let x = 0; x < width; x++) {
        points.push({
          type: 'stud',
          position: {
            x: (x + 0.5 - width / 2) * LEGO.STUD_SPACING,
            y: heightMM,
            z: (depth - 0.5 - depth / 2) * LEGO.STUD_SPACING,
          },
          direction: { x: 0, y: 1, z: 0 },
        })
      }
    }

    // Bottom anti-studs (full coverage)
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        points.push({
          type: 'anti_stud',
          position: {
            x: (x + 0.5 - width / 2) * LEGO.STUD_SPACING,
            y: 0,
            z: (z + 0.5 - depth / 2) * LEGO.STUD_SPACING,
          },
          direction: { x: 0, y: -1, z: 0 },
        })
      }
    }

    return points
  }

  /**
   * Create a round brick definition (1x1 round)
   */
  private createRoundBrick(
    id: string,
    ldrawId: string,
    name: string,
    width: number,
    heightInPlates: number,
    hollow: boolean = false
  ): BrickDefinition {
    return {
      id,
      ldrawId,
      name,
      category: 'round',
      shape: 'round',
      shapeParams: {
        hollow,
      },
      dimensions: {
        width,
        depth: width, // Round bricks are always square
        height: heightInPlates,
      },
      connectionPoints: this.generateRoundConnections(width, heightInPlates),
      colliderShapes: this.generateCylinderCollider(width, heightInPlates),
      mass: width * width * heightInPlates * 0.4,
    }
  }

  /**
   * Generate connection points for round bricks
   */
  private generateRoundConnections(_width: number, height: number): ConnectionPoint[] {
    const points: ConnectionPoint[] = []
    const heightMM = height * LEGO.PLATE_HEIGHT

    // Center stud on top
    points.push({
      type: 'stud',
      position: { x: 0, y: heightMM, z: 0 },
      direction: { x: 0, y: 1, z: 0 },
    })

    // Center anti-stud on bottom
    points.push({
      type: 'anti_stud',
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
    })

    return points
  }

  /**
   * Generate cylinder collider for round bricks
   */
  private generateCylinderCollider(width: number, height: number): ColliderShape[] {
    const radius = (width * LEGO.STUD_SPACING) / 2
    const heightMM = height * LEGO.PLATE_HEIGHT

    return [
      {
        type: 'cylinder',
        radius,
        height: heightMM,
        offset: {
          x: 0,
          y: heightMM / 2,
          z: 0,
        },
      },
    ]
  }

  /**
   * Create a cone brick definition
   */
  private createConeBrick(
    id: string,
    ldrawId: string,
    name: string,
    width: number,
    heightInPlates: number
  ): BrickDefinition {
    return {
      id,
      ldrawId,
      name,
      category: 'round',
      shape: 'cone',
      dimensions: {
        width,
        depth: width,
        height: heightInPlates,
      },
      connectionPoints: this.generateConeConnections(width, heightInPlates),
      colliderShapes: this.generateCylinderCollider(width, heightInPlates),
      mass: width * width * heightInPlates * 0.3,
    }
  }

  /**
   * Generate connection points for cone bricks
   */
  private generateConeConnections(_width: number, height: number): ConnectionPoint[] {
    const points: ConnectionPoint[] = []
    const heightMM = height * LEGO.PLATE_HEIGHT

    // Top stud
    points.push({
      type: 'stud',
      position: { x: 0, y: heightMM, z: 0 },
      direction: { x: 0, y: 1, z: 0 },
    })

    // Bottom anti-stud (center only for cone)
    points.push({
      type: 'anti_stud',
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: -1, z: 0 },
    })

    return points
  }

  /**
   * Register default basic bricks
   */
  private registerDefaultBricks(): void {
    // Standard Bricks (height = 3 plates)
    this.register(this.createBasicBrick('brick_1x1', '3005.dat', 'Brick 1x1', 1, 1, 3))
    this.register(this.createBasicBrick('brick_1x2', '3004.dat', 'Brick 1x2', 2, 1, 3))
    this.register(this.createBasicBrick('brick_1x3', '3622.dat', 'Brick 1x3', 3, 1, 3))
    this.register(this.createBasicBrick('brick_1x4', '3010.dat', 'Brick 1x4', 4, 1, 3))
    this.register(this.createBasicBrick('brick_1x6', '3009.dat', 'Brick 1x6', 6, 1, 3))
    this.register(this.createBasicBrick('brick_1x8', '3008.dat', 'Brick 1x8', 8, 1, 3))
    this.register(this.createBasicBrick('brick_2x2', '3003.dat', 'Brick 2x2', 2, 2, 3))
    this.register(this.createBasicBrick('brick_2x3', '3002.dat', 'Brick 2x3', 3, 2, 3))
    this.register(this.createBasicBrick('brick_2x4', '3001.dat', 'Brick 2x4', 4, 2, 3))
    this.register(this.createBasicBrick('brick_2x6', '2456.dat', 'Brick 2x6', 6, 2, 3))
    this.register(this.createBasicBrick('brick_2x8', '3007.dat', 'Brick 2x8', 8, 2, 3))

    // Plates (height = 1 plate)
    this.register(this.createBasicBrick('plate_1x1', '3024.dat', 'Plate 1x1', 1, 1, 1))
    this.register(this.createBasicBrick('plate_1x2', '3023.dat', 'Plate 1x2', 2, 1, 1))
    this.register(this.createBasicBrick('plate_1x3', '3623.dat', 'Plate 1x3', 3, 1, 1))
    this.register(this.createBasicBrick('plate_1x4', '3710.dat', 'Plate 1x4', 4, 1, 1))
    this.register(this.createBasicBrick('plate_1x6', '3666.dat', 'Plate 1x6', 6, 1, 1))
    this.register(this.createBasicBrick('plate_1x8', '3460.dat', 'Plate 1x8', 8, 1, 1))
    this.register(this.createBasicBrick('plate_2x2', '3022.dat', 'Plate 2x2', 2, 2, 1))
    this.register(this.createBasicBrick('plate_2x3', '3021.dat', 'Plate 2x3', 3, 2, 1))
    this.register(this.createBasicBrick('plate_2x4', '3020.dat', 'Plate 2x4', 4, 2, 1))
    this.register(this.createBasicBrick('plate_2x6', '3795.dat', 'Plate 2x6', 6, 2, 1))
    this.register(this.createBasicBrick('plate_2x8', '3034.dat', 'Plate 2x8', 8, 2, 1))
    this.register(this.createBasicBrick('plate_4x4', '3031.dat', 'Plate 4x4', 4, 4, 1))
    this.register(this.createBasicBrick('plate_4x6', '3032.dat', 'Plate 4x6', 6, 4, 1))
    this.register(this.createBasicBrick('plate_4x8', '3035.dat', 'Plate 4x8', 8, 4, 1))
    this.register(this.createBasicBrick('plate_6x6', '3958.dat', 'Plate 6x6', 6, 6, 1))
    this.register(this.createBasicBrick('plate_8x8', '41539.dat', 'Plate 8x8', 8, 8, 1))

    // Slope Bricks - 45 degree
    this.register(this.createSlopeBrick('slope_45_1x2', '3040.dat', 'Slope 45° 1x2', 1, 2, 3, 45, 'front'))
    this.register(this.createSlopeBrick('slope_45_2x2', '3039.dat', 'Slope 45° 2x2', 2, 2, 3, 45, 'front'))
    this.register(this.createSlopeBrick('slope_45_1x3', '4286.dat', 'Slope 45° 1x3', 1, 3, 3, 45, 'front'))
    this.register(this.createSlopeBrick('slope_45_2x3', '3038.dat', 'Slope 45° 2x3', 2, 3, 3, 45, 'front'))
    this.register(this.createSlopeBrick('slope_45_2x4', '3037.dat', 'Slope 45° 2x4', 2, 4, 3, 45, 'front'))

    // Slope Bricks - 33 degree (gentler slope)
    this.register(this.createSlopeBrick('slope_33_1x3', '4286.dat', 'Slope 33° 1x3', 1, 3, 2, 33, 'front'))
    this.register(this.createSlopeBrick('slope_33_2x3', '3298.dat', 'Slope 33° 2x3', 2, 3, 2, 33, 'front'))
    this.register(this.createSlopeBrick('slope_33_3x3', '3675.dat', 'Slope 33° 3x3', 3, 3, 2, 33, 'front'))

    // Slope Bricks - 65 degree (steeper slope)
    this.register(this.createSlopeBrick('slope_65_1x2', '60481.dat', 'Slope 65° 1x2', 1, 2, 3, 65, 'front'))
    this.register(this.createSlopeBrick('slope_65_2x2', '60481.dat', 'Slope 65° 2x2', 2, 2, 3, 65, 'front'))

    // Round Bricks
    this.register(this.createRoundBrick('brick_round_1x1', '3062b.dat', 'Brick Round 1x1', 1, 3, false))
    this.register(this.createRoundBrick('brick_round_2x2', '3941.dat', 'Brick Round 2x2', 2, 3, false))

    // Round Plates
    this.register(this.createRoundBrick('plate_round_1x1', '6141.dat', 'Plate Round 1x1', 1, 1, false))
    this.register(this.createRoundBrick('plate_round_2x2', '4032.dat', 'Plate Round 2x2', 2, 1, false))

    // Cones
    this.register(this.createConeBrick('cone_1x1', '4589.dat', 'Cone 1x1', 1, 3))
    this.register(this.createConeBrick('cone_2x2', '3942c.dat', 'Cone 2x2x2', 2, 6))
  }
}

export const BrickRegistry = new BrickRegistryClass()
