import { useEffect } from 'react'
import { LegoCanvas } from '@/components/canvas'
import { Toolbar, PartsPalette, ColorPicker } from '@/components/ui'
import { useSceneStore, useUIStore } from '@/store'

export function App() {
  const undo = useSceneStore(state => state.undo)
  const redo = useSceneStore(state => state.redo)
  const clearSelection = useSceneStore(state => state.clearSelection)
  const selectedBrickIds = useSceneStore(state => state.selectedBrickIds)
  const removeBrick = useSceneStore(state => state.removeBrick)
  const setTool = useUIStore(state => state.setTool)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        e.preventDefault()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        redo()
        e.preventDefault()
      }

      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        for (const id of selectedBrickIds) {
          removeBrick(id)
        }
        e.preventDefault()
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection()
        setTool('select')
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 's') setTool('select')
      if (e.key === 'p' || e.key === 'b') setTool('place')
      if (e.key === 'd' || e.key === 'x') setTool('delete')
      if (e.key === 'c') setTool('paint')
      // Note: 'R' key for rotation is now handled in GhostBrick during place mode
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, clearSelection, selectedBrickIds, removeBrick, setTool])

  return (
    <div style={styles.container}>
      <LegoCanvas />
      <Toolbar />
      <PartsPalette />
      <ColorPicker />

      {/* Help text */}
      <div style={styles.help}>
        <p><strong>V</strong> Select | <strong>P</strong> Place | <strong>D</strong> Delete | <strong>R</strong> Rotate</p>
        <p><strong>Click</strong> to place/select | <strong>Shift+Click</strong> multi-select | <strong>Del</strong> remove</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  help: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 11,
    lineHeight: 1.5,
    zIndex: 100,
  },
}

export default App
