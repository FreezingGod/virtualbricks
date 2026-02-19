import { useState, useEffect } from 'react'
import { useUIStore, useSceneStore, type Tool } from '@/store'
import { SaveLoadDialog } from './SaveLoadDialog'
import { storageService } from '@/services/StorageService'

const tools: { id: Tool; icon: string; label: string }[] = [
  { id: 'select', icon: '👆', label: 'Select' },
  { id: 'place', icon: '➕', label: 'Place (R to rotate)' },
  { id: 'delete', icon: '🗑️', label: 'Delete' },
  { id: 'paint', icon: '🎨', label: 'Paint' },
]

export function Toolbar() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'save' | 'load'>('save')
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const bricks = useSceneStore(state => state.bricks)
  const currentTool = useUIStore(state => state.currentTool)
  const setTool = useUIStore(state => state.setTool)
  const showGrid = useUIStore(state => state.showGrid)
  const toggleGrid = useUIStore(state => state.toggleGrid)
  const physicsEnabled = useUIStore(state => state.physicsEnabled)
  const togglePhysics = useUIStore(state => state.togglePhysics)
  const gravityEnabled = useUIStore(state => state.gravityEnabled)
  const toggleGravity = useUIStore(state => state.toggleGravity)

  const undo = useSceneStore(state => state.undo)
  const redo = useSceneStore(state => state.redo)
  const clearScene = useSceneStore(state => state.clearScene)

  // Load last project ID on mount
  useEffect(() => {
    storageService.init().then(async () => {
      const lastId = await storageService.getLastProjectId()
      if (lastId) {
        setCurrentProjectId(lastId)
      }
    })
  }, [])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [bricks])

  // Keyboard shortcuts for save/load
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        setDialogMode('save')
        setDialogOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        setDialogMode('load')
        setDialogOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpenSave = () => {
    setDialogMode('save')
    setDialogOpen(true)
  }

  const handleOpenLoad = () => {
    setDialogMode('load')
    setDialogOpen(true)
  }

  const handleProjectChange = (projectId: string | null) => {
    setCurrentProjectId(projectId)
    setHasUnsavedChanges(false)
  }

  return (
    <div style={styles.toolbar}>
      <div style={styles.toolGroup}>
        {tools.map(tool => (
          <button
            key={tool.id}
            style={{
              ...styles.toolButton,
              ...(currentTool === tool.id ? styles.toolButtonActive : {}),
            }}
            onClick={() => setTool(tool.id)}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div style={styles.separator} />

      <div style={styles.toolGroup}>
        <button style={styles.toolButton} onClick={undo} title="Undo (Ctrl+Z)">
          ↩️
        </button>
        <button style={styles.toolButton} onClick={redo} title="Redo (Ctrl+Y)">
          ↪️
        </button>
      </div>

      <div style={styles.separator} />

      <div style={styles.toolGroup}>
        <button
          style={{
            ...styles.toolButton,
            ...(showGrid ? styles.toolButtonActive : {}),
          }}
          onClick={toggleGrid}
          title="Toggle Grid"
        >
          #
        </button>
        <button
          style={styles.toolButton}
          onClick={clearScene}
          title="Clear Scene"
        >
          🗑️
        </button>
      </div>

      <div style={styles.separator} />

      {/* Physics controls */}
      <div style={styles.toolGroup}>
        <button
          style={{
            ...styles.toolButton,
            ...(physicsEnabled ? styles.toolButtonActive : {}),
          }}
          onClick={togglePhysics}
          title="Toggle Physics"
        >
          <span style={{ fontSize: 14 }}>PHY</span>
        </button>
        <button
          style={{
            ...styles.toolButton,
            ...(gravityEnabled ? styles.toolButtonActive : {}),
            opacity: physicsEnabled ? 1 : 0.5,
          }}
          onClick={toggleGravity}
          disabled={!physicsEnabled}
          title="Toggle Gravity"
        >
          <span style={{ fontSize: 14 }}>G</span>
        </button>
      </div>

      <div style={styles.separator} />

      {/* Save/Load controls */}
      <div style={styles.toolGroup}>
        <button
          style={{
            ...styles.toolButton,
            position: 'relative',
          }}
          onClick={handleOpenSave}
          title="Save Project (Ctrl+S)"
        >
          💾
          {hasUnsavedChanges && bricks.size > 0 && (
            <span style={styles.unsavedDot} />
          )}
        </button>
        <button
          style={styles.toolButton}
          onClick={handleOpenLoad}
          title="Load Project (Ctrl+O)"
        >
          📂
        </button>
      </div>

      {/* Save/Load Dialog */}
      <SaveLoadDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={dialogMode}
        currentProjectId={currentProjectId}
        onProjectChange={handleProjectChange}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  },
  toolGroup: {
    display: 'flex',
    gap: 4,
  },
  toolButton: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: 18,
    transition: 'all 0.15s ease',
  },
  toolButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  unsavedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: '#ff9800',
    borderRadius: '50%',
    border: '1px solid white',
  },
}
