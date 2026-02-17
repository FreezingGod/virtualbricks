import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { BrickInstance, BrickData, Connection } from '@/types'

interface HistoryEntry {
  bricks: Map<string, BrickInstance>
  connections: Map<string, Connection>
}

interface SceneState {
  // Brick instances
  bricks: Map<string, BrickInstance>

  // Connections between bricks
  connections: Map<string, Connection>

  // Selection state
  selectedBrickIds: string[]

  // History for undo/redo
  history: HistoryEntry[]
  historyIndex: number
  maxHistorySize: number

  // Actions
  addBrick: (definitionId: string, position: { x: number; y: number; z: number }, colorId: number, rotation?: { x: number; y: number; z: number }) => string
  removeBrick: (id: string) => void
  updateBrick: (id: string, updates: Partial<BrickInstance>) => void
  moveBrick: (id: string, position: { x: number; y: number; z: number }) => void
  rotateBrick: (id: string, rotation: { x: number; y: number; z: number }) => void
  setBrickColor: (id: string, colorId: number) => void

  // Selection
  selectBrick: (id: string, additive?: boolean) => void
  deselectBrick: (id: string) => void
  clearSelection: () => void
  selectAll: () => void

  // History
  undo: () => void
  redo: () => void
  saveToHistory: () => void

  // Serialization
  exportScene: () => BrickData[]
  importScene: (data: BrickData[]) => void
  clearScene: () => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
  bricks: new Map(),
  connections: new Map(),
  selectedBrickIds: [],
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  addBrick: (definitionId, position, colorId, rotation) => {
    const id = uuid()
    const brick: BrickInstance = {
      id,
      definitionId,
      position,
      rotation: rotation ?? { x: 0, y: 0, z: 0 },
      colorId,
      isSelected: false,
      isLocked: false,
      isGhost: false,
      connections: [],
      isStatic: false,
    }

    set(state => {
      const newBricks = new Map(state.bricks)
      newBricks.set(id, brick)
      return { bricks: newBricks }
    })

    get().saveToHistory()
    return id
  },

  removeBrick: (id) => {
    set(state => {
      const newBricks = new Map(state.bricks)
      newBricks.delete(id)

      // Remove from selection
      const newSelection = state.selectedBrickIds.filter(bid => bid !== id)

      // Remove connections involving this brick
      const newConnections = new Map(state.connections)
      for (const [connId, conn] of newConnections) {
        if (conn.brick1Id === id || conn.brick2Id === id) {
          newConnections.delete(connId)
        }
      }

      return {
        bricks: newBricks,
        selectedBrickIds: newSelection,
        connections: newConnections,
      }
    })

    get().saveToHistory()
  },

  updateBrick: (id, updates) => {
    set(state => {
      const brick = state.bricks.get(id)
      if (!brick) return state

      const newBricks = new Map(state.bricks)
      newBricks.set(id, { ...brick, ...updates })
      return { bricks: newBricks }
    })
  },

  moveBrick: (id, position) => {
    get().updateBrick(id, { position })
  },

  rotateBrick: (id, rotation) => {
    get().updateBrick(id, { rotation })
  },

  setBrickColor: (id, colorId) => {
    get().updateBrick(id, { colorId })
    get().saveToHistory()
  },

  selectBrick: (id, additive = false) => {
    set(state => {
      const brick = state.bricks.get(id)
      if (!brick) return state

      const newBricks = new Map(state.bricks)
      let newSelection: string[]

      if (additive) {
        // Toggle selection
        if (state.selectedBrickIds.includes(id)) {
          newSelection = state.selectedBrickIds.filter(bid => bid !== id)
          newBricks.set(id, { ...brick, isSelected: false })
        } else {
          newSelection = [...state.selectedBrickIds, id]
          newBricks.set(id, { ...brick, isSelected: true })
        }
      } else {
        // Replace selection
        for (const [bid, b] of newBricks) {
          newBricks.set(bid, { ...b, isSelected: bid === id })
        }
        newSelection = [id]
      }

      return { bricks: newBricks, selectedBrickIds: newSelection }
    })
  },

  deselectBrick: (id) => {
    set(state => {
      const brick = state.bricks.get(id)
      if (!brick) return state

      const newBricks = new Map(state.bricks)
      newBricks.set(id, { ...brick, isSelected: false })

      return {
        bricks: newBricks,
        selectedBrickIds: state.selectedBrickIds.filter(bid => bid !== id),
      }
    })
  },

  clearSelection: () => {
    set(state => {
      const newBricks = new Map(state.bricks)
      for (const [id, brick] of newBricks) {
        if (brick.isSelected) {
          newBricks.set(id, { ...brick, isSelected: false })
        }
      }
      return { bricks: newBricks, selectedBrickIds: [] }
    })
  },

  selectAll: () => {
    set(state => {
      const newBricks = new Map(state.bricks)
      const newSelection: string[] = []

      for (const [id, brick] of newBricks) {
        newBricks.set(id, { ...brick, isSelected: true })
        newSelection.push(id)
      }

      return { bricks: newBricks, selectedBrickIds: newSelection }
    })
  },

  saveToHistory: () => {
    set(state => {
      const entry: HistoryEntry = {
        bricks: new Map(state.bricks),
        connections: new Map(state.connections),
      }

      // Remove future entries if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(entry)

      // Limit history size
      while (newHistory.length > state.maxHistorySize) {
        newHistory.shift()
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      }
    })
  },

  undo: () => {
    set(state => {
      if (state.historyIndex <= 0) return state

      const newIndex = state.historyIndex - 1
      const entry = state.history[newIndex]

      return {
        bricks: new Map(entry.bricks),
        connections: new Map(entry.connections),
        historyIndex: newIndex,
        selectedBrickIds: [],
      }
    })
  },

  redo: () => {
    set(state => {
      if (state.historyIndex >= state.history.length - 1) return state

      const newIndex = state.historyIndex + 1
      const entry = state.history[newIndex]

      return {
        bricks: new Map(entry.bricks),
        connections: new Map(entry.connections),
        historyIndex: newIndex,
        selectedBrickIds: [],
      }
    })
  },

  exportScene: () => {
    const state = get()
    const data: BrickData[] = []

    for (const brick of state.bricks.values()) {
      data.push({
        id: brick.id,
        definitionId: brick.definitionId,
        position: brick.position,
        rotation: brick.rotation,
        colorId: brick.colorId,
        stepIndex: brick.stepIndex,
        groupId: brick.groupId,
      })
    }

    return data
  },

  importScene: (data) => {
    set(() => {
      const newBricks = new Map<string, BrickInstance>()

      for (const d of data) {
        newBricks.set(d.id, {
          id: d.id,
          definitionId: d.definitionId,
          position: d.position,
          rotation: d.rotation,
          colorId: d.colorId,
          isSelected: false,
          isLocked: false,
          isGhost: false,
          connections: [],
          isStatic: false,
          stepIndex: d.stepIndex,
          groupId: d.groupId,
        })
      }

      return {
        bricks: newBricks,
        connections: new Map(),
        selectedBrickIds: [],
        history: [],
        historyIndex: -1,
      }
    })

    get().saveToHistory()
  },

  clearScene: () => {
    set({
      bricks: new Map(),
      connections: new Map(),
      selectedBrickIds: [],
    })
    get().saveToHistory()
  },
}))
