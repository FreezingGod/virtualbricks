import { useUIStore, useSceneStore, type Tool } from '@/store'

const tools: { id: Tool; icon: string; label: string }[] = [
  { id: 'select', icon: '👆', label: 'Select' },
  { id: 'place', icon: '➕', label: 'Place (R to rotate)' },
  { id: 'delete', icon: '🗑️', label: 'Delete' },
  { id: 'paint', icon: '🎨', label: 'Paint' },
]

export function Toolbar() {
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
}
