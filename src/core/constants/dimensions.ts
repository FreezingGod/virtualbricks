/**
 * LEGO Brick Dimensions Constants
 * All measurements in millimeters (mm)
 * Based on official LEGO specifications and LDraw standards
 */

// Basic unit measurements
export const LEGO = {
  /** Basic unit (0.8mm) - smallest increment */
  UNIT: 0.8,

  /** Stud spacing (8mm) - distance between stud centers */
  STUD_SPACING: 8.0,

  /** Stud diameter (4.8mm) */
  STUD_DIAMETER: 4.8,

  /** Stud radius (2.4mm) */
  STUD_RADIUS: 2.4,

  /** Stud height (1.6mm) - protruding height */
  STUD_HEIGHT: 1.6,

  /** Plate height (3.2mm) - without studs */
  PLATE_HEIGHT: 3.2,

  /** Brick height (9.6mm) - equals 3 plates */
  BRICK_HEIGHT: 9.6,

  /** Wall thickness (1.6mm) - standard brick wall */
  WALL_THICKNESS: 1.6,

  /** Anti-stud (tube) outer diameter (6.51mm) */
  TUBE_OUTER_DIAMETER: 6.51,

  /** Anti-stud (tube) inner diameter (4.8mm) */
  TUBE_INNER_DIAMETER: 4.8,

  /** Technic hole diameter (4.85mm) */
  TECHNIC_HOLE_DIAMETER: 4.85,

  /** Technic axle diameter (4.7mm) */
  TECHNIC_AXLE_DIAMETER: 4.7,

  /** Technic pin diameter (4.85mm) */
  TECHNIC_PIN_DIAMETER: 4.85,

  /** Technic beam height (7.2mm) */
  TECHNIC_BEAM_HEIGHT: 7.2,
} as const

/**
 * LDraw Unit (LDU) conversions
 * 1 LDU = 0.4mm (approximately)
 * More precisely: 20 LDU = 8mm (1 stud spacing)
 */
export const LDU = {
  /** Millimeters per LDU */
  MM_PER_LDU: 0.4,

  /** LDU per millimeter */
  LDU_PER_MM: 2.5,

  /** Stud spacing in LDU (20 LDU) */
  STUD_SPACING: 20,

  /** Brick height in LDU (24 LDU) */
  BRICK_HEIGHT: 24,

  /** Plate height in LDU (8 LDU) */
  PLATE_HEIGHT: 8,

  /** Stud diameter in LDU (12 LDU) */
  STUD_DIAMETER: 12,

  /** Stud height in LDU (4 LDU) */
  STUD_HEIGHT: 4,
} as const

/**
 * Convert millimeters to LDU
 */
export function mmToLDU(mm: number): number {
  return mm * LDU.LDU_PER_MM
}

/**
 * Convert LDU to millimeters
 */
export function lduToMM(ldu: number): number {
  return ldu * LDU.MM_PER_LDU
}

/**
 * Convert studs to millimeters
 */
export function studsToMM(studs: number): number {
  return studs * LEGO.STUD_SPACING
}

/**
 * Convert plates to millimeters
 */
export function platesToMM(plates: number): number {
  return plates * LEGO.PLATE_HEIGHT
}

/**
 * Snap a position to the LEGO grid with proper stud alignment
 *
 * LEGO studs must align for bricks to connect. This requires:
 * - Even stud counts (2, 4, 6...): center offset by half stud (4mm)
 * - Odd stud counts (1, 3, 5...): center on grid
 *
 * @param position - The position to snap
 * @param widthStuds - Width in studs (for X axis alignment)
 * @param depthStuds - Depth in studs (for Z axis alignment)
 */
export function snapToGrid(
  position: { x: number; y: number; z: number },
  widthStuds: number = 1,
  depthStuds: number = 1
): { x: number; y: number; z: number } {
  const halfStud = LEGO.STUD_SPACING / 2

  // For even stud counts, center is between studs (offset by 4mm)
  // For odd stud counts, center is on a stud (no offset)
  const xOffset = widthStuds % 2 === 0 ? halfStud : 0
  const zOffset = depthStuds % 2 === 0 ? halfStud : 0

  return {
    x: Math.round((position.x - xOffset) / LEGO.STUD_SPACING) * LEGO.STUD_SPACING + xOffset,
    y: Math.round(position.y / LEGO.PLATE_HEIGHT) * LEGO.PLATE_HEIGHT,
    z: Math.round((position.z - zOffset) / LEGO.STUD_SPACING) * LEGO.STUD_SPACING + zOffset,
  }
}
