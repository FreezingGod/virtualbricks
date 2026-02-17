import { create } from 'zustand'

export type Tool = 'select' | 'place' | 'delete' | 'paint'

interface UIState {
  // Current tool
  currentTool: Tool

  // Selected brick definition for placement
  selectedDefinitionId: string | null

  // Selected color for placement/painting
  selectedColorId: number

  // Ghost brick rotation (Y-axis rotation in 90-degree increments)
  ghostRotationY: number

  // View settings
  showGrid: boolean
  showConnections: boolean
  showPhysicsDebug: boolean

  // Physics settings
  physicsEnabled: boolean
  gravityEnabled: boolean

  // Panel visibility
  showPartsPalette: boolean
  showPropertyPanel: boolean

  // Camera settings
  cameraMode: 'orbit' | 'pan'

  // Actions
  setTool: (tool: Tool) => void
  setSelectedDefinition: (id: string | null) => void
  setSelectedColor: (colorId: number) => void
  rotateGhost: () => void
  resetGhostRotation: () => void
  toggleGrid: () => void
  toggleConnections: () => void
  togglePhysicsDebug: () => void
  togglePhysics: () => void
  toggleGravity: () => void
  togglePartsPalette: () => void
  togglePropertyPanel: () => void
  setCameraMode: (mode: 'orbit' | 'pan') => void
}

export const useUIStore = create<UIState>((set) => ({
  currentTool: 'select',
  selectedDefinitionId: 'brick_2x4',
  selectedColorId: 4, // Red
  ghostRotationY: 0,
  showGrid: true,
  showConnections: false,
  showPhysicsDebug: false,
  physicsEnabled: false,
  gravityEnabled: false,
  showPartsPalette: true,
  showPropertyPanel: true,
  cameraMode: 'orbit',

  setTool: (tool) => set({ currentTool: tool }),

  setSelectedDefinition: (id) => set({ selectedDefinitionId: id, ghostRotationY: 0 }),

  setSelectedColor: (colorId) => set({ selectedColorId: colorId }),

  rotateGhost: () => set(state => ({ ghostRotationY: state.ghostRotationY + Math.PI / 2 })),

  resetGhostRotation: () => set({ ghostRotationY: 0 }),

  toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),

  toggleConnections: () => set(state => ({ showConnections: !state.showConnections })),

  togglePhysicsDebug: () => set(state => ({ showPhysicsDebug: !state.showPhysicsDebug })),

  togglePhysics: () => set(state => ({ physicsEnabled: !state.physicsEnabled })),

  toggleGravity: () => set(state => ({ gravityEnabled: !state.gravityEnabled })),

  togglePartsPalette: () => set(state => ({ showPartsPalette: !state.showPartsPalette })),

  togglePropertyPanel: () => set(state => ({ showPropertyPanel: !state.showPropertyPanel })),

  setCameraMode: (mode) => set({ cameraMode: mode }),
}))
