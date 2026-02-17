/**
 * Connection type between bricks
 */
export type ConnectionType =
  | 'stud_antistud'    // Standard stud-to-antistud connection
  | 'axle_hole'        // Technic axle-to-hole
  | 'pin_hole'         // Technic pin-to-hole
  | 'technic_beam'     // Technic beam connection
  | 'clip_bar'         // Clip-to-bar connection

/**
 * Connection between two bricks
 */
export interface Connection {
  id: string
  type: ConnectionType

  // Connected brick IDs
  brick1Id: string
  brick2Id: string

  // Connection point indices on each brick
  point1Index: number
  point2Index: number

  // Connection properties
  isRigid: boolean              // Fixed vs rotatable
  rotationAxis?: { x: number; y: number; z: number }  // For rotatable connections
  rotationLimits?: [number, number]  // Min/max rotation (radians)

  // Timestamp
  createdAt: number
}

/**
 * Potential connection detected during placement
 */
export interface PotentialConnection {
  brick1Id: string
  brick2Id: string
  point1Index: number
  point2Index: number
  distance: number
  snapPosition: { x: number; y: number; z: number }
  snapRotation?: { x: number; y: number; z: number }
}

/**
 * Connection strength data (force in Newtons)
 */
export const CONNECTION_STRENGTH: Record<ConnectionType, number> = {
  'stud_antistud': 15,
  'axle_hole': 8,
  'pin_hole': 12,
  'technic_beam': 10,
  'clip_bar': 5,
}
