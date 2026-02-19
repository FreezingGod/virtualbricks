import { useState, useEffect, useCallback } from 'react'
import { storageService, type Project, type ProjectListItem } from '@/services/StorageService'
import { useSceneStore } from '@/store/useSceneStore'
import { LDrawExporter } from '@/exporters/LDrawExporter'

interface SaveLoadDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: 'save' | 'load'
  currentProjectId?: string | null
  onProjectChange?: (projectId: string | null) => void
}

export function SaveLoadDialog({
  isOpen,
  onClose,
  mode,
  currentProjectId,
  onProjectChange,
}: SaveLoadDialogProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)

  const exportScene = useSceneStore(state => state.exportScene)
  const importScene = useSceneStore(state => state.importScene)

  // Load projects list
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      await storageService.init()
      const list = await storageService.listProjects()
      setProjects(list)
    } catch (err) {
      setError('Failed to load projects')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      setSelectedProjectId(currentProjectId || null)
      setShowNewProject(mode === 'save' && projects.length === 0)
      setError(null)
    }
  }, [isOpen, loadProjects, currentProjectId, mode, projects.length])

  // Save project
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const brickData = exportScene()

      if (showNewProject || !selectedProjectId) {
        // Create new project
        if (!newProjectName.trim()) {
          setError('Please enter a project name')
          return
        }
        const project = await storageService.createProject(newProjectName.trim(), brickData)
        await storageService.setLastProjectId(project.id)
        onProjectChange?.(project.id)
      } else {
        // Update existing project
        await storageService.updateProject(selectedProjectId, brickData)
        await storageService.setLastProjectId(selectedProjectId)
      }

      onClose()
    } catch (err) {
      setError('Failed to save project')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Load project
  const handleLoad = async () => {
    if (!selectedProjectId) {
      setError('Please select a project')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const project = await storageService.getProject(selectedProjectId)
      if (!project) {
        setError('Project not found')
        return
      }

      importScene(project.bricks)
      await storageService.setLastProjectId(project.id)
      onProjectChange?.(project.id)
      onClose()
    } catch (err) {
      setError('Failed to load project')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Delete project
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await storageService.deleteProject(id)
      await loadProjects()
      if (selectedProjectId === id) {
        setSelectedProjectId(null)
      }
      if (currentProjectId === id) {
        onProjectChange?.(null)
      }
    } catch (err) {
      setError('Failed to delete project')
      console.error(err)
    }
  }

  // Export to JSON file
  const handleExportJSON = async () => {
    try {
      const brickData = exportScene()
      const project: Project = {
        id: 'export',
        name: 'Exported Project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        bricks: brickData,
      }

      const json = storageService.exportToJSON(project)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `lego-project-${Date.now()}.json`
      a.click()

      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export project')
      console.error(err)
    }
  }

  // Import from JSON file
  const handleImportJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const project = await storageService.importFromJSON(text)
        importScene(project.bricks)
        onProjectChange?.(project.id)
        await loadProjects()
        onClose()
      } catch (err) {
        setError('Failed to import project: Invalid file format')
        console.error(err)
      }
    }
    input.click()
  }

  // Export to LDraw file
  const handleExportLDraw = () => {
    try {
      const brickData = exportScene()
      if (brickData.length === 0) {
        setError('No bricks to export')
        return
      }

      const projectName = currentProjectId
        ? projects.find(p => p.id === currentProjectId)?.name || 'model'
        : 'model'

      const ldrawContent = LDrawExporter.exportWithSteps(brickData, projectName)
      LDrawExporter.download(ldrawContent, `${projectName.replace(/\s+/g, '_')}.ldr`)
    } catch (err) {
      setError('Failed to export LDraw file')
      console.error(err)
    }
  }

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {mode === 'save' ? 'Save Project' : 'Load Project'}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* Content */}
        <div style={styles.content}>
          {mode === 'save' && (
            <div style={styles.saveOptions}>
              {/* New project option */}
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={showNewProject}
                  onChange={() => setShowNewProject(true)}
                />
                <span>Save as new project</span>
              </label>

              {showNewProject && (
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  style={styles.input}
                  autoFocus
                />
              )}

              {projects.length > 0 && (
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    checked={!showNewProject}
                    onChange={() => setShowNewProject(false)}
                  />
                  <span>Overwrite existing project</span>
                </label>
              )}
            </div>
          )}

          {/* Projects list */}
          {(!showNewProject || mode === 'load') && (
            <div style={styles.projectList}>
              {loading ? (
                <div style={styles.loading}>Loading...</div>
              ) : projects.length === 0 ? (
                <div style={styles.empty}>
                  No saved projects yet.
                  {mode === 'load' && ' Create one by saving your current work!'}
                </div>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    style={{
                      ...styles.projectItem,
                      ...(selectedProjectId === project.id ? styles.projectItemSelected : {}),
                    }}
                    onClick={() => setSelectedProjectId(project.id)}
                    onDoubleClick={() => {
                      setSelectedProjectId(project.id)
                      if (mode === 'load') handleLoad()
                    }}
                  >
                    <div style={styles.projectThumbnail}>
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt="" style={styles.thumbnailImg} />
                      ) : (
                        <div style={styles.thumbnailPlaceholder}>
                          {project.brickCount}
                        </div>
                      )}
                    </div>
                    <div style={styles.projectInfo}>
                      <div style={styles.projectName}>
                        {project.name}
                        {currentProjectId === project.id && (
                          <span style={styles.currentBadge}>Current</span>
                        )}
                      </div>
                      <div style={styles.projectMeta}>
                        {project.brickCount} bricks · {formatDate(project.updatedAt)}
                      </div>
                    </div>
                    <button
                      style={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project.id)
                      }}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <button style={styles.secondaryButton} onClick={handleExportJSON}>
              Export JSON
            </button>
            <button style={styles.secondaryButton} onClick={handleImportJSON}>
              Import JSON
            </button>
            <button style={styles.ldrawButton} onClick={handleExportLDraw}>
              Export LDraw
            </button>
          </div>
          <div style={styles.footerRight}>
            <button style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            {mode === 'save' ? (
              <button
                style={styles.primaryButton}
                onClick={handleSave}
                disabled={saving || (showNewProject && !newProjectName.trim())}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            ) : (
              <button
                style={styles.primaryButton}
                onClick={handleLoad}
                disabled={!selectedProjectId || loading}
              >
                Load
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 28,
    cursor: 'pointer',
    color: '#666',
    padding: '0 4px',
    lineHeight: 1,
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px 20px',
    fontSize: 14,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
  },
  saveOptions: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 6,
    outline: 'none',
    marginLeft: 22,
    boxSizing: 'border-box',
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#666',
  },
  projectItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  projectItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  projectThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#f5f5f5',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 600,
    color: '#666',
    backgroundColor: '#e0e0e0',
  },
  projectInfo: {
    flex: 1,
    minWidth: 0,
  },
  projectName: {
    fontSize: 15,
    fontWeight: 500,
    color: '#333',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  currentBadge: {
    fontSize: 11,
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 500,
  },
  projectMeta: {
    fontSize: 13,
    color: '#666',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    padding: 8,
    opacity: 0.6,
    transition: 'opacity 0.15s ease',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderTop: '1px solid #e0e0e0',
    gap: 12,
  },
  footerLeft: {
    display: 'flex',
    gap: 8,
  },
  footerRight: {
    display: 'flex',
    gap: 8,
  },
  secondaryButton: {
    padding: '8px 12px',
    fontSize: 13,
    border: '1px solid #ddd',
    borderRadius: 6,
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#555',
  },
  ldrawButton: {
    padding: '8px 12px',
    fontSize: 13,
    border: '1px solid #ff9800',
    borderRadius: 6,
    backgroundColor: '#fff3e0',
    cursor: 'pointer',
    color: '#e65100',
    fontWeight: 500,
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 6,
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#555',
  },
  primaryButton: {
    padding: '10px 20px',
    fontSize: 14,
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#2196f3',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 500,
  },
}

export default SaveLoadDialog
