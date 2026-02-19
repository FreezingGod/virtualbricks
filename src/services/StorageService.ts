import type { BrickData } from '@/types'

/**
 * Project metadata and data structure
 */
export interface Project {
  id: string
  name: string
  description?: string
  thumbnail?: string  // Base64 encoded image
  createdAt: number
  updatedAt: number
  bricks: BrickData[]
}

/**
 * Project list item (without full brick data)
 */
export interface ProjectListItem {
  id: string
  name: string
  description?: string
  thumbnail?: string
  createdAt: number
  updatedAt: number
  brickCount: number
}

const DB_NAME = 'lego-simulator'
const DB_VERSION = 1
const PROJECTS_STORE = 'projects'
const SETTINGS_STORE = 'settings'

/**
 * Storage service using IndexedDB for project persistence
 */
class StorageService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectsStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
          projectsStore.createIndex('name', 'name', { unique: false })
          projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase> {
    await this.init()
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  /**
   * Generate a unique project ID
   */
  generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save a new project or update existing
   */
  async saveProject(project: Project): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], 'readwrite')
      const store = transaction.objectStore(PROJECTS_STORE)

      const request = store.put(project)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Create a new project from current scene
   */
  async createProject(name: string, bricks: BrickData[], thumbnail?: string, description?: string): Promise<Project> {
    const now = Date.now()
    const project: Project = {
      id: this.generateId(),
      name,
      description,
      thumbnail,
      createdAt: now,
      updatedAt: now,
      bricks,
    }

    await this.saveProject(project)
    return project
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, bricks: BrickData[], thumbnail?: string): Promise<Project | null> {
    const project = await this.getProject(id)
    if (!project) return null

    project.bricks = bricks
    project.updatedAt = Date.now()
    if (thumbnail) {
      project.thumbnail = thumbnail
    }

    await this.saveProject(project)
    return project
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], 'readonly')
      const store = transaction.objectStore(PROJECTS_STORE)

      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  /**
   * Get all projects (metadata only, sorted by updatedAt descending)
   */
  async listProjects(): Promise<ProjectListItem[]> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], 'readonly')
      const store = transaction.objectStore(PROJECTS_STORE)

      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const projects = request.result as Project[]

        // Convert to list items and sort by updatedAt
        const items: ProjectListItem[] = projects
          .map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            thumbnail: p.thumbnail,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            brickCount: p.bricks.length,
          }))
          .sort((a, b) => b.updatedAt - a.updatedAt)

        resolve(items)
      }
    })
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], 'readwrite')
      const store = transaction.objectStore(PROJECTS_STORE)

      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Rename a project
   */
  async renameProject(id: string, newName: string): Promise<void> {
    const project = await this.getProject(id)
    if (!project) {
      throw new Error('Project not found')
    }

    project.name = newName
    project.updatedAt = Date.now()
    await this.saveProject(project)
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(id: string, newName?: string): Promise<Project | null> {
    const project = await this.getProject(id)
    if (!project) return null

    const now = Date.now()
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      name: newName || `${project.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    }

    await this.saveProject(newProject)
    return newProject
  }

  /**
   * Export project to JSON file
   */
  exportToJSON(project: Project): string {
    return JSON.stringify(project, null, 2)
  }

  /**
   * Import project from JSON string
   */
  async importFromJSON(jsonString: string): Promise<Project> {
    try {
      const data = JSON.parse(jsonString)

      // Validate required fields
      if (!data.name || !Array.isArray(data.bricks)) {
        throw new Error('Invalid project format')
      }

      const now = Date.now()
      const project: Project = {
        id: this.generateId(),
        name: data.name,
        description: data.description,
        thumbnail: data.thumbnail,
        createdAt: now,
        updatedAt: now,
        bricks: data.bricks,
      }

      await this.saveProject(project)
      return project
    } catch (error) {
      throw new Error(`Failed to import project: ${error}`)
    }
  }

  /**
   * Get/set settings
   */
  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly')
      const store = transaction.objectStore(SETTINGS_STORE)

      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result?.value ?? null)
      }
    })
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite')
      const store = transaction.objectStore(SETTINGS_STORE)

      const request = store.put({ key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get last opened project ID
   */
  async getLastProjectId(): Promise<string | null> {
    return this.getSetting<string>('lastProjectId')
  }

  /**
   * Set last opened project ID
   */
  async setLastProjectId(id: string): Promise<void> {
    return this.setSetting('lastProjectId', id)
  }

  /**
   * Clear all data (use with caution!)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE, SETTINGS_STORE], 'readwrite')

      transaction.objectStore(PROJECTS_STORE).clear()
      transaction.objectStore(SETTINGS_STORE).clear()

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

// Export singleton instance
export const storageService = new StorageService()
