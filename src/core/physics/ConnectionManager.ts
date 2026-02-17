import { v4 as uuid } from 'uuid'
import type { BrickInstance, Connection, ConnectionPoint } from '@/types'
import { BrickRegistry } from '@/core/brick'

export interface ConnectionCandidate {
  brick1Id: string
  brick2Id: string
  point1: ConnectionPoint
  point2: ConnectionPoint
  point1Index: number
  point2Index: number
  distance: number
}

/**
 * Manages connections between bricks
 * Detects and tracks stud-to-antistud connections
 */
export class ConnectionManager {
  private static instance: ConnectionManager
  private connections: Map<string, Connection> = new Map()

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  /**
   * Get world position of a connection point on a brick
   */
  private getConnectionWorldPosition(
    brick: BrickInstance,
    point: ConnectionPoint
  ): { x: number; y: number; z: number } {
    // Apply rotation if needed (currently assuming no rotation)
    return {
      x: brick.position.x + point.position.x,
      y: brick.position.y + point.position.y,
      z: brick.position.z + point.position.z,
    }
  }

  /**
   * Find all connections for a brick at a given position
   */
  findConnections(
    newBrick: BrickInstance,
    existingBricks: BrickInstance[],
    tolerance: number = 0.5
  ): ConnectionCandidate[] {
    const candidates: ConnectionCandidate[] = []
    const newDef = BrickRegistry.get(newBrick.definitionId)
    if (!newDef) return candidates

    const newAntiStuds = newDef.connectionPoints.filter(p => p.type === 'anti_stud')
    const newStuds = newDef.connectionPoints.filter(p => p.type === 'stud')

    for (const existingBrick of existingBricks) {
      if (existingBrick.id === newBrick.id) continue

      const existingDef = BrickRegistry.get(existingBrick.definitionId)
      if (!existingDef) continue

      const existingStuds = existingDef.connectionPoints.filter(p => p.type === 'stud')
      const existingAntiStuds = existingDef.connectionPoints.filter(p => p.type === 'anti_stud')

      // Check new brick's anti-studs against existing brick's studs
      for (let i = 0; i < newAntiStuds.length; i++) {
        const newAntiStud = newAntiStuds[i]
        const newPos = this.getConnectionWorldPosition(newBrick, newAntiStud)

        for (let j = 0; j < existingStuds.length; j++) {
          const existingStud = existingStuds[j]
          const existingPos = this.getConnectionWorldPosition(existingBrick, existingStud)

          const dx = Math.abs(newPos.x - existingPos.x)
          const dy = Math.abs(newPos.y - existingPos.y)
          const dz = Math.abs(newPos.z - existingPos.z)

          if (dx < tolerance && dy < tolerance && dz < tolerance) {
            candidates.push({
              brick1Id: newBrick.id,
              brick2Id: existingBrick.id,
              point1: newAntiStud,
              point2: existingStud,
              point1Index: newDef.connectionPoints.indexOf(newAntiStud),
              point2Index: existingDef.connectionPoints.indexOf(existingStud),
              distance: Math.sqrt(dx * dx + dy * dy + dz * dz),
            })
          }
        }
      }

      // Check new brick's studs against existing brick's anti-studs
      for (let i = 0; i < newStuds.length; i++) {
        const newStud = newStuds[i]
        const newPos = this.getConnectionWorldPosition(newBrick, newStud)

        for (let j = 0; j < existingAntiStuds.length; j++) {
          const existingAntiStud = existingAntiStuds[j]
          const existingPos = this.getConnectionWorldPosition(existingBrick, existingAntiStud)

          const dx = Math.abs(newPos.x - existingPos.x)
          const dy = Math.abs(newPos.y - existingPos.y)
          const dz = Math.abs(newPos.z - existingPos.z)

          if (dx < tolerance && dy < tolerance && dz < tolerance) {
            candidates.push({
              brick1Id: newBrick.id,
              brick2Id: existingBrick.id,
              point1: newStud,
              point2: existingAntiStud,
              point1Index: newDef.connectionPoints.indexOf(newStud),
              point2Index: existingDef.connectionPoints.indexOf(existingAntiStud),
              distance: Math.sqrt(dx * dx + dy * dy + dz * dz),
            })
          }
        }
      }
    }

    return candidates
  }

  /**
   * Create connections from candidates
   */
  createConnections(candidates: ConnectionCandidate[]): Connection[] {
    const newConnections: Connection[] = []

    for (const candidate of candidates) {
      // Check if connection already exists
      const existingKey = this.getConnectionKey(candidate.brick1Id, candidate.brick2Id)
      if (this.connections.has(existingKey)) continue

      const connection: Connection = {
        id: uuid(),
        type: 'stud_antistud',
        brick1Id: candidate.brick1Id,
        brick2Id: candidate.brick2Id,
        point1Index: candidate.point1Index,
        point2Index: candidate.point2Index,
        isRigid: true,
        createdAt: Date.now(),
      }

      this.connections.set(connection.id, connection)
      newConnections.push(connection)
    }

    return newConnections
  }

  /**
   * Get a unique key for a connection pair
   */
  private getConnectionKey(brick1Id: string, brick2Id: string): string {
    return [brick1Id, brick2Id].sort().join(':')
  }

  /**
   * Remove connections for a brick
   */
  removeConnectionsForBrick(brickId: string): Connection[] {
    const removed: Connection[] = []

    for (const [id, conn] of this.connections) {
      if (conn.brick1Id === brickId || conn.brick2Id === brickId) {
        removed.push(conn)
        this.connections.delete(id)
      }
    }

    return removed
  }

  /**
   * Get all connections
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values())
  }

  /**
   * Get connections for a specific brick
   */
  getConnectionsForBrick(brickId: string): Connection[] {
    return this.getAllConnections().filter(
      c => c.brick1Id === brickId || c.brick2Id === brickId
    )
  }

  /**
   * Get connected brick IDs for a brick
   */
  getConnectedBrickIds(brickId: string): string[] {
    const connections = this.getConnectionsForBrick(brickId)
    const ids: string[] = []

    for (const conn of connections) {
      if (conn.brick1Id === brickId) {
        ids.push(conn.brick2Id)
      } else {
        ids.push(conn.brick1Id)
      }
    }

    return ids
  }

  /**
   * Find all bricks connected in a group (traversing connections)
   */
  findConnectedGroup(startBrickId: string): Set<string> {
    const visited = new Set<string>()
    const queue = [startBrickId]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (visited.has(currentId)) continue

      visited.add(currentId)

      const connectedIds = this.getConnectedBrickIds(currentId)
      for (const id of connectedIds) {
        if (!visited.has(id)) {
          queue.push(id)
        }
      }
    }

    return visited
  }

  /**
   * Check if a brick is grounded (connected to a brick at y=0)
   */
  isGrounded(brickId: string, bricks: Map<string, BrickInstance>): boolean {
    const group = this.findConnectedGroup(brickId)

    for (const id of group) {
      const brick = bricks.get(id)
      if (brick && brick.position.y <= 0) {
        return true
      }
    }

    return false
  }

  /**
   * Clear all connections
   */
  clear(): void {
    this.connections.clear()
  }

  /**
   * Load connections from external source
   */
  loadConnections(connections: Connection[]): void {
    this.connections.clear()
    for (const conn of connections) {
      this.connections.set(conn.id, conn)
    }
  }
}

export const connectionManager = ConnectionManager.getInstance()
