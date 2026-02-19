import type { BrickData } from '@/types'
import { BrickRegistry } from '@/core/brick'
import { LDU } from '@/core/constants'

/**
 * LDraw file format exporter
 *
 * LDraw is an open standard for LEGO CAD programs.
 * File format specification: https://www.ldraw.org/article/218.html
 *
 * Key differences from our coordinate system:
 * - LDraw uses -Y up (Y axis points down)
 * - LDraw uses LDU units (1 LDU = 0.4mm)
 * - Rotation matrix is row-major in the file
 */
export class LDrawExporter {
  /**
   * Export bricks to LDraw .ldr format
   */
  static export(bricks: BrickData[], modelName: string = 'Untitled'): string {
    const lines: string[] = []

    // File header
    lines.push(`0 ${modelName}`)
    lines.push('0 Name: model.ldr')
    lines.push('0 Author: LEGO Simulator')
    lines.push(`0 !LDRAW_ORG Unofficial_Model`)
    lines.push('')

    // Export each brick
    for (const brick of bricks) {
      const line = this.exportBrick(brick)
      if (line) {
        lines.push(line)
      }
    }

    lines.push('')
    lines.push('0 NOFILE')

    return lines.join('\n')
  }

  /**
   * Export bricks to LDraw .mpd (Multi-Part Document) format
   * MPD allows multiple models in one file
   */
  static exportMPD(bricks: BrickData[], modelName: string = 'Untitled'): string {
    const lines: string[] = []

    // MPD header
    lines.push(`0 FILE ${modelName}.ldr`)
    lines.push(`0 ${modelName}`)
    lines.push('0 Name: model.ldr')
    lines.push('0 Author: LEGO Simulator')
    lines.push(`0 !LDRAW_ORG Unofficial_Model`)
    lines.push('')

    // Export each brick
    for (const brick of bricks) {
      const line = this.exportBrick(brick)
      if (line) {
        lines.push(line)
      }
    }

    lines.push('')
    lines.push('0 NOFILE')

    return lines.join('\n')
  }

  /**
   * Export a single brick to LDraw line type 1 format
   *
   * Line type 1 format:
   * 1 <colour> <x> <y> <z> <a> <b> <c> <d> <e> <f> <g> <h> <i> <file>
   *
   * Where a-i form a 3x3 rotation/scale matrix:
   * | a d g |
   * | b e h |
   * | c f i |
   *
   * Coordinate system conversion:
   * - Three.js: Y-up (right-handed)
   * - LDraw: Y-down (right-handed)
   *
   * To convert, we apply a reflection: Y' = -Y
   * For the rotation matrix, we need to conjugate by the reflection matrix:
   * R' = S * R * S where S = diag(1, -1, 1)
   * This negates row 2 and column 2 of the rotation matrix.
   */
  private static exportBrick(brick: BrickData): string | null {
    const definition = BrickRegistry.get(brick.definitionId)
    if (!definition) {
      console.warn(`Unknown brick definition: ${brick.definitionId}`)
      return null
    }

    // Get LDraw part file name
    const partFile = definition.ldrawId

    // Convert color ID (already using LDraw color codes)
    const color = brick.colorId

    // Convert position from mm to LDU
    // LDraw Y axis points down, so negate Y
    const x = this.mmToLDU(brick.position.x)
    const y = this.mmToLDU(-brick.position.y)
    const z = this.mmToLDU(brick.position.z)

    // Calculate rotation matrix from Euler angles
    const m = this.eulerToMatrix(brick.rotation)

    // Apply coordinate system transformation: R' = S * R * S
    // where S = diag(1, -1, 1) reflects the Y axis
    // This negates elements in row 2 and column 2, but double-negates (1,1)
    // Result: negate (0,1), (1,0), (1,2), (2,1)
    // Matrix indices:    [1],   [3],   [5],   [7]
    const matrix = [
      m[0], -m[1], m[2],    // Row 0: (0,0), (0,1), (0,2)
      -m[3], m[4], -m[5],   // Row 1: (1,0), (1,1), (1,2)
      m[6], -m[7], m[8],    // Row 2: (2,0), (2,1), (2,2)
    ]

    // Format: 1 color x y z a b c d e f g h i file
    // LDraw matrix is written as: a d g b e h c f i (column-major for rows)
    const parts = [
      '1',
      color.toString(),
      this.formatNumber(x),
      this.formatNumber(y),
      this.formatNumber(z),
      // Matrix in LDraw order: a=m[0], d=m[1], g=m[2], b=m[3], e=m[4], h=m[5], c=m[6], f=m[7], i=m[8]
      this.formatNumber(matrix[0]),  // a
      this.formatNumber(matrix[3]),  // d
      this.formatNumber(matrix[6]),  // g
      this.formatNumber(matrix[1]),  // b
      this.formatNumber(matrix[4]),  // e
      this.formatNumber(matrix[7]),  // h
      this.formatNumber(matrix[2]),  // c
      this.formatNumber(matrix[5]),  // f
      this.formatNumber(matrix[8]),  // i
      partFile,
    ]

    return parts.join(' ')
  }

  /**
   * Convert millimeters to LDraw units
   */
  private static mmToLDU(mm: number): number {
    return mm * LDU.LDU_PER_MM
  }

  /**
   * Convert Euler angles (radians) to 3x3 rotation matrix
   * Returns array of 9 elements in row-major order
   */
  private static eulerToMatrix(rotation: { x: number; y: number; z: number }): number[] {
    const { x: rx, y: ry, z: rz } = rotation

    const cx = Math.cos(rx)
    const sx = Math.sin(rx)
    const cy = Math.cos(ry)
    const sy = Math.sin(ry)
    const cz = Math.cos(rz)
    const sz = Math.sin(rz)

    // Combined rotation matrix (Z * Y * X order)
    // This matches Three.js default Euler order 'XYZ'
    return [
      cy * cz,
      -cy * sz,
      sy,
      sx * sy * cz + cx * sz,
      -sx * sy * sz + cx * cz,
      -sx * cy,
      -cx * sy * cz + sx * sz,
      cx * sy * sz + sx * cz,
      cx * cy,
    ]
  }

  /**
   * Format number for LDraw output
   * - Remove unnecessary decimal places
   * - Handle floating point precision issues
   */
  private static formatNumber(n: number): string {
    // Round to avoid floating point issues
    const rounded = Math.round(n * 1000) / 1000

    // Check if it's effectively an integer
    if (Math.abs(rounded - Math.round(rounded)) < 0.0001) {
      return Math.round(rounded).toString()
    }

    // Otherwise format with up to 3 decimal places
    return rounded.toFixed(3).replace(/\.?0+$/, '')
  }

  /**
   * Generate a build step comment
   */
  static stepComment(): string {
    return '0 STEP'
  }

  /**
   * Export with build steps
   * Groups bricks by stepIndex and adds STEP comments
   */
  static exportWithSteps(bricks: BrickData[], modelName: string = 'Untitled'): string {
    const lines: string[] = []

    // File header
    lines.push(`0 ${modelName}`)
    lines.push('0 Name: model.ldr')
    lines.push('0 Author: LEGO Simulator')
    lines.push(`0 !LDRAW_ORG Unofficial_Model`)
    lines.push('')

    // Group bricks by step
    const stepGroups = new Map<number, BrickData[]>()
    for (const brick of bricks) {
      const step = brick.stepIndex ?? 0
      if (!stepGroups.has(step)) {
        stepGroups.set(step, [])
      }
      stepGroups.get(step)!.push(brick)
    }

    // Sort steps and export
    const sortedSteps = Array.from(stepGroups.keys()).sort((a, b) => a - b)
    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i]
      const stepBricks = stepGroups.get(step)!

      // Add step comment (except for first step)
      if (i > 0) {
        lines.push('')
        lines.push(this.stepComment())
        lines.push('')
      }

      // Export bricks in this step
      for (const brick of stepBricks) {
        const line = this.exportBrick(brick)
        if (line) {
          lines.push(line)
        }
      }
    }

    lines.push('')
    lines.push('0 NOFILE')

    return lines.join('\n')
  }

  /**
   * Download LDraw file
   */
  static download(content: string, filename: string = 'model.ldr'): void {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
  }
}

export default LDrawExporter
