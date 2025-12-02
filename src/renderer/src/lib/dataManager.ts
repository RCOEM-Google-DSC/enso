/**
 * Generalized data manager for handling CRUD operations on JSON data files.
 * Works via IPC with the main process to persist changes to disk.
 */

export type DataOperation = 'add' | 'remove' | 'removeAll' | 'save'

export interface DataManagerResult<T = unknown> {
  ok: boolean
  path?: string
  data?: T[]
  error?: string
}

/**
 * Remove a record by id from the specified data file.
 * Main process reads, filters, and writes the updated array.
 */
export async function handleRemove(dataFile: string, id: string): Promise<DataManagerResult> {
  try {
    const win = window as any

    if (win.api?.removeData) {
      return await win.api.removeData(dataFile, id)
    } else if (win.electron?.ipcRenderer?.invoke) {
      return await win.electron.ipcRenderer.invoke('data:remove', dataFile, id)
    } else {
      return {
        ok: false,
        error: 'No IPC available to persist data removal.'
      }
    }
  } catch (err) {
    console.error('Failed to remove data:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Add a new record to the specified data file.
 * Main process reads existing data, appends the new record, and writes.
 */
export async function handleAdd<T = unknown>(
  dataFile: string,
  record: T
): Promise<DataManagerResult<T>> {
  try {
    const win = window as any

    if (win.api?.addData) {
      return await win.api.addData(dataFile, record)
    } else if (win.electron?.ipcRenderer?.invoke) {
      return await win.electron.ipcRenderer.invoke('data:add', dataFile, record)
    } else {
      return {
        ok: false,
        error: 'No IPC available to persist data addition.'
      }
    }
  } catch (err) {
    console.error('Failed to add data:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Remove all records from the specified data file.
 * Main process writes an empty array.
 */
export async function handleRemoveAll(dataFile: string): Promise<DataManagerResult> {
  try {
    const win = window as any

    if (win.api?.removeAllData) {
      return await win.api.removeAllData(dataFile)
    } else if (win.electron?.ipcRenderer?.invoke) {
      return await win.electron.ipcRenderer.invoke('data:removeAll', dataFile)
    } else {
      return {
        ok: false,
        error: 'No IPC available to persist data removal.'
      }
    }
  } catch (err) {
    console.error('Failed to remove all data:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Save/replace the entire data array to the specified data file.
 * Main process writes the provided array.
 */
export async function handleSave<T = unknown>(
  dataFile: string,
  data: T[]
): Promise<DataManagerResult<T>> {
  try {
    const win = window as any

    if (win.api?.saveData) {
      return await win.api.saveData(dataFile, data)
    } else if (win.electron?.ipcRenderer?.invoke) {
      return await win.electron.ipcRenderer.invoke('data:save', dataFile, data)
    } else {
      return {
        ok: false,
        error: 'No IPC available to persist data save.'
      }
    }
  } catch (err) {
    console.error('Failed to save data:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Load data from the specified data file.
 * Main process reads and returns the data array.
 */
export async function handleLoad<T = unknown>(dataFile: string): Promise<DataManagerResult<T>> {
  try {
    const win = window as any

    if (win.api?.loadData) {
      return await win.api.loadData(dataFile)
    } else if (win.electron?.ipcRenderer?.invoke) {
      return await win.electron.ipcRenderer.invoke('data:load', dataFile)
    } else {
      return {
        ok: false,
        error: 'No IPC available to load data.'
      }
    }
  } catch (err) {
    console.error('Failed to load data:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
