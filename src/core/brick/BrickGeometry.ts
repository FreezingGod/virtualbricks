import * as THREE from 'three'
import { LEGO } from '@/core/constants'
import type { BrickDefinition } from '@/types'

// Bevel/chamfer size for brick edges (in mm)
// Real LEGO bricks have subtle beveled edges that make individual bricks distinguishable
const BEVEL_SIZE = 0.3

/**
 * Generates Three.js geometry for LEGO bricks
 */
export class BrickGeometryGenerator {
  private static geometryCache: Map<string, THREE.BufferGeometry> = new Map()

  /**
   * Get or generate geometry for a brick definition
   */
  static getGeometry(definition: BrickDefinition): THREE.BufferGeometry {
    const cacheKey = definition.id

    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey)!
    }

    const geometry = this.generateBrickGeometry(definition)
    this.geometryCache.set(cacheKey, geometry)
    return geometry
  }

  /**
   * Generate geometry for a basic brick
   */
  private static generateBrickGeometry(definition: BrickDefinition): THREE.BufferGeometry {
    const { width, depth, height } = definition.dimensions

    const widthMM = width * LEGO.STUD_SPACING
    const depthMM = depth * LEGO.STUD_SPACING
    const heightMM = height * LEGO.PLATE_HEIGHT

    const geometries: THREE.BufferGeometry[] = []

    // Main body with beveled edges
    const bodyGeometry = this.createBeveledBox(
      widthMM,
      heightMM,
      depthMM,
      BEVEL_SIZE
    )
    geometries.push(bodyGeometry)

    // Top studs with subtle bevel on top edge
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const studGeometry = this.createBeveledCylinder(
          LEGO.STUD_RADIUS,
          LEGO.STUD_HEIGHT,
          BEVEL_SIZE * 0.5
        )
        studGeometry.translate(
          (x + 0.5 - width / 2) * LEGO.STUD_SPACING,
          heightMM + LEGO.STUD_HEIGHT / 2,
          (z + 0.5 - depth / 2) * LEGO.STUD_SPACING
        )
        geometries.push(studGeometry)
      }
    }

    // Bottom tubes (anti-studs) for larger bricks
    if (width > 1 || depth > 1) {
      const tubes = this.createBottomTubes(width, depth, heightMM)
      geometries.push(...tubes)
    }

    // Merge all geometries
    const mergedGeometry = this.mergeGeometries(geometries)

    // Clean up individual geometries
    geometries.forEach(g => g.dispose())

    return mergedGeometry
  }

  /**
   * Create a box with beveled/chamfered edges
   * The bevel makes individual bricks visually distinguishable when connected
   */
  private static createBeveledBox(
    width: number,
    height: number,
    depth: number,
    bevel: number
  ): THREE.BufferGeometry {
    const hw = width / 2
    const hh = height
    const hd = depth / 2
    const b = bevel

    // Create vertices for a box with chamfered edges
    // We'll create the box as multiple faces with beveled corners
    const vertices: number[] = []
    const normals: number[] = []
    const indices: number[] = []

    // Helper to add a quad (two triangles)
    const addQuad = (
      v0: number[], v1: number[], v2: number[], v3: number[],
      n: number[]
    ) => {
      const baseIndex = vertices.length / 3
      vertices.push(...v0, ...v1, ...v2, ...v3)
      normals.push(...n, ...n, ...n, ...n)
      indices.push(
        baseIndex, baseIndex + 1, baseIndex + 2,
        baseIndex, baseIndex + 2, baseIndex + 3
      )
    }

    // Top face (Y = height, with inset for bevel)
    // Vertices in counter-clockwise order when viewed from above
    addQuad(
      [-hw + b, hh, -hd + b], [-hw + b, hh, hd - b],
      [hw - b, hh, hd - b], [hw - b, hh, -hd + b],
      [0, 1, 0]
    )

    // Bottom face (Y = 0, with inset for bevel)
    // Vertices in counter-clockwise order when viewed from below
    addQuad(
      [-hw + b, 0, -hd + b], [hw - b, 0, -hd + b],
      [hw - b, 0, hd - b], [-hw + b, 0, hd - b],
      [0, -1, 0]
    )

    // Front face (Z = depth/2, with inset for bevel)
    addQuad(
      [-hw + b, b, hd], [hw - b, b, hd],
      [hw - b, hh - b, hd], [-hw + b, hh - b, hd],
      [0, 0, 1]
    )

    // Back face (Z = -depth/2, with inset for bevel)
    addQuad(
      [hw - b, b, -hd], [-hw + b, b, -hd],
      [-hw + b, hh - b, -hd], [hw - b, hh - b, -hd],
      [0, 0, -1]
    )

    // Right face (X = width/2, with inset for bevel)
    addQuad(
      [hw, b, hd - b], [hw, b, -hd + b],
      [hw, hh - b, -hd + b], [hw, hh - b, hd - b],
      [1, 0, 0]
    )

    // Left face (X = -width/2, with inset for bevel)
    addQuad(
      [-hw, b, -hd + b], [-hw, b, hd - b],
      [-hw, hh - b, hd - b], [-hw, hh - b, -hd + b],
      [-1, 0, 0]
    )

    // Top edge bevels (4 edges)
    const topY = hh
    const topInnerY = hh - b
    const bevelNormY = 0.707 // 45 degree bevel

    // Top-front bevel
    addQuad(
      [-hw + b, topInnerY, hd], [hw - b, topInnerY, hd],
      [hw - b, topY, hd - b], [-hw + b, topY, hd - b],
      [0, bevelNormY, bevelNormY]
    )
    // Top-back bevel
    addQuad(
      [hw - b, topInnerY, -hd], [-hw + b, topInnerY, -hd],
      [-hw + b, topY, -hd + b], [hw - b, topY, -hd + b],
      [0, bevelNormY, -bevelNormY]
    )
    // Top-right bevel
    addQuad(
      [hw, topInnerY, hd - b], [hw, topInnerY, -hd + b],
      [hw - b, topY, -hd + b], [hw - b, topY, hd - b],
      [bevelNormY, bevelNormY, 0]
    )
    // Top-left bevel
    addQuad(
      [-hw, topInnerY, -hd + b], [-hw, topInnerY, hd - b],
      [-hw + b, topY, hd - b], [-hw + b, topY, -hd + b],
      [-bevelNormY, bevelNormY, 0]
    )

    // Bottom edge bevels (4 edges)
    const bottomY = 0
    const bottomInnerY = b

    // Bottom-front bevel
    addQuad(
      [-hw + b, bottomY, hd - b], [hw - b, bottomY, hd - b],
      [hw - b, bottomInnerY, hd], [-hw + b, bottomInnerY, hd],
      [0, -bevelNormY, bevelNormY]
    )
    // Bottom-back bevel
    addQuad(
      [hw - b, bottomY, -hd + b], [-hw + b, bottomY, -hd + b],
      [-hw + b, bottomInnerY, -hd], [hw - b, bottomInnerY, -hd],
      [0, -bevelNormY, -bevelNormY]
    )
    // Bottom-right bevel
    addQuad(
      [hw - b, bottomY, hd - b], [hw - b, bottomY, -hd + b],
      [hw, bottomInnerY, -hd + b], [hw, bottomInnerY, hd - b],
      [bevelNormY, -bevelNormY, 0]
    )
    // Bottom-left bevel
    addQuad(
      [-hw + b, bottomY, -hd + b], [-hw + b, bottomY, hd - b],
      [-hw, bottomInnerY, hd - b], [-hw, bottomInnerY, -hd + b],
      [-bevelNormY, -bevelNormY, 0]
    )

    // Vertical edge bevels (4 edges)
    // Front-right vertical bevel
    addQuad(
      [hw - b, b, hd], [hw, b, hd - b],
      [hw, hh - b, hd - b], [hw - b, hh - b, hd],
      [bevelNormY, 0, bevelNormY]
    )
    // Front-left vertical bevel
    addQuad(
      [-hw, b, hd - b], [-hw + b, b, hd],
      [-hw + b, hh - b, hd], [-hw, hh - b, hd - b],
      [-bevelNormY, 0, bevelNormY]
    )
    // Back-right vertical bevel
    addQuad(
      [hw, b, -hd + b], [hw - b, b, -hd],
      [hw - b, hh - b, -hd], [hw, hh - b, -hd + b],
      [bevelNormY, 0, -bevelNormY]
    )
    // Back-left vertical bevel
    addQuad(
      [-hw + b, b, -hd], [-hw, b, -hd + b],
      [-hw, hh - b, -hd + b], [-hw + b, hh - b, -hd],
      [-bevelNormY, 0, -bevelNormY]
    )

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setIndex(indices)

    return geometry
  }

  /**
   * Create a cylinder with beveled top edge (for studs)
   */
  private static createBeveledCylinder(
    radius: number,
    height: number,
    bevel: number
  ): THREE.BufferGeometry {
    // Use lathe geometry to create cylinder with beveled top
    const points: THREE.Vector2[] = []

    // Bottom edge
    points.push(new THREE.Vector2(0, 0))
    points.push(new THREE.Vector2(radius, 0))
    // Side
    points.push(new THREE.Vector2(radius, height - bevel))
    // Beveled top edge
    points.push(new THREE.Vector2(radius - bevel, height))
    // Top center
    points.push(new THREE.Vector2(0, height))

    const geometry = new THREE.LatheGeometry(points, 16)
    geometry.translate(0, -height / 2, 0)

    return geometry
  }

  /**
   * Create bottom tubes for anti-stud connections
   */
  private static createBottomTubes(width: number, depth: number, heightMM: number): THREE.BufferGeometry[] {
    const tubes: THREE.BufferGeometry[] = []
    // Tube height should be based on actual brick/plate height, not fixed BRICK_HEIGHT
    const tubeHeight = Math.max(0, heightMM - LEGO.WALL_THICKNESS)

    // Don't create tubes if they would be too short to be useful
    if (tubeHeight < LEGO.WALL_THICKNESS) {
      return tubes
    }

    // Tubes are placed between studs
    for (let x = 0; x < width - 1; x++) {
      for (let z = 0; z < depth - 1; z++) {
        // Outer cylinder
        const outerTube = new THREE.CylinderGeometry(
          LEGO.TUBE_OUTER_DIAMETER / 2,
          LEGO.TUBE_OUTER_DIAMETER / 2,
          tubeHeight,
          16
        )
        outerTube.translate(
          (x + 1 - width / 2) * LEGO.STUD_SPACING,
          tubeHeight / 2,
          (z + 1 - depth / 2) * LEGO.STUD_SPACING
        )
        tubes.push(outerTube)
      }
    }

    return tubes
  }

  /**
   * Merge multiple geometries into one
   */
  private static mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geometries.length === 0) {
      return new THREE.BufferGeometry()
    }

    if (geometries.length === 1) {
      return geometries[0].clone()
    }

    // Calculate total vertex and index counts
    let totalVertices = 0
    let totalIndices = 0

    for (const geom of geometries) {
      const pos = geom.getAttribute('position')
      totalVertices += pos ? pos.count : 0
      const idx = geom.getIndex()
      totalIndices += idx ? idx.count : 0
    }

    // Create merged arrays
    const positions = new Float32Array(totalVertices * 3)
    const normals = new Float32Array(totalVertices * 3)
    const indices = new Uint32Array(totalIndices)

    let vertexOffset = 0
    let indexOffset = 0
    let vertexIndexOffset = 0

    for (const geom of geometries) {
      const pos = geom.getAttribute('position') as THREE.BufferAttribute
      const norm = geom.getAttribute('normal') as THREE.BufferAttribute
      const idx = geom.getIndex()

      if (pos) {
        positions.set(pos.array, vertexOffset * 3)
      }
      if (norm) {
        normals.set(norm.array, vertexOffset * 3)
      }
      if (idx) {
        for (let i = 0; i < idx.count; i++) {
          indices[indexOffset + i] = idx.array[i] + vertexIndexOffset
        }
        indexOffset += idx.count
      }

      vertexIndexOffset += pos ? pos.count : 0
      vertexOffset += pos ? pos.count : 0
    }

    const merged = new THREE.BufferGeometry()
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    merged.setIndex(new THREE.BufferAttribute(indices, 1))
    merged.computeVertexNormals()

    return merged
  }

  /**
   * Clear the geometry cache
   */
  static clearCache(): void {
    this.geometryCache.forEach(geom => geom.dispose())
    this.geometryCache.clear()
  }
}
