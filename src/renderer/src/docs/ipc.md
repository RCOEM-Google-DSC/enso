# IPC Documentation

## Preload Index.ts

### custom API needed for persisting data changes to files

```ts
const api = {
  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    maximize: (): void => ipcRenderer.send('window:maximize'),
    close: (): void => ipcRenderer.send('window:close')
  },

  saveTestData: (
    data: unknown
  ): Promise<{
    ok: boolean
    path?: string
  }> => ipcRenderer.invoke('test-data:save', data),

  // Remove a single record by id. Main process will read/filter/write and return the updated array (or an error).
  removeTestData: (
    id: string
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('test-data:remove', id),

  // Generalized data operations for any data file
  removeData: (
    dataFile: string,
    id: string
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:remove', dataFile, id),

  addData: (
    dataFile: string,
    record: unknown
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:add', dataFile, record),

  removeAllData: (
    dataFile: string
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:removeAll', dataFile),

  saveData: (
    dataFile: string,
    data: unknown
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:save', dataFile, data),

  loadData: (
    dataFile: string
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:load', dataFile)
}
```

## IPC Handlers

### Generalized data operations for any data file

```ts
app.whenReady().then(async () => {
  // Helper to resolve data file path
  const getDataFilePath = (filename: string): string => {
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      return join(process.cwd(), 'src', 'renderer', 'src', 'data', filename)
    } else {
      return join(app.getPath('userData'), filename)
    }
  }

  // Remove a record by id from any data file
  ipcMain.handle('data:remove', async (_event, dataFile: string, id: string) => {
    try {
      const fs = await import('fs/promises')
      const dataPath = getDataFilePath(dataFile)

      console.log('[MAIN] data:remove called with:', { dataFile, id, dataPath })

      let raw = '[]'
      try {
        raw = await fs.readFile(dataPath, 'utf8')
        console.log('[MAIN] Read file, length:', raw.length)
      } catch (e) {
        console.log('[MAIN] Failed to read file, using empty array:', e)
        raw = '[]'
      }

      let arr: any[] = []
      try {
        arr = JSON.parse(raw)
        if (!Array.isArray(arr)) arr = []
        console.log('[MAIN] Parsed array, initial length:', arr.length)
      } catch (e) {
        console.log('[MAIN] Failed to parse JSON:', e)
        arr = []
      }

      console.log('[MAIN] Filtering. ID to remove:', id, 'Type:', typeof id)
      console.log(
        '[MAIN] Sample IDs in array:',
        arr.slice(0, 5).map((item) => ({ id: item?.id, type: typeof item?.id }))
      )

      const filtered = arr.filter((item) => {
        const itemId = String(item?.id)
        const targetId = String(id)
        const keep = itemId !== targetId
        if (!keep) {
          console.log('[MAIN] Removing item with ID:', itemId)
        }
        return keep
      })

      console.log('[MAIN] After filtering, length:', filtered.length)

      await fs.writeFile(dataPath, JSON.stringify(filtered, null, 2), 'utf8')

      return { ok: true, path: dataPath, data: filtered }
    } catch (err) {
      console.error('Failed to remove data', err)
      return { ok: false, error: String(err) }
    }
  })

  // Add a record to any data file
  ipcMain.handle('data:add', async (_event, dataFile: string, record: any) => {
    try {
      const fs = await import('fs/promises')
      const dataPath = getDataFilePath(dataFile)

      let raw = '[]'
      try {
        raw = await fs.readFile(dataPath, 'utf8')
      } catch (e) {
        raw = '[]'
      }

      let arr: any[] = []
      try {
        arr = JSON.parse(raw)
        if (!Array.isArray(arr)) arr = []
      } catch (e) {
        arr = []
      }

      arr.push(record)
      await fs.writeFile(dataPath, JSON.stringify(arr, null, 2), 'utf8')

      return { ok: true, path: dataPath, data: arr }
    } catch (err) {
      console.error('Failed to add data', err)
      return { ok: false, error: String(err) }
    }
  })

  // Remove all records from any data file
  ipcMain.handle('data:removeAll', async (_event, dataFile: string) => {
    try {
      const fs = await import('fs/promises')
      const dataPath = getDataFilePath(dataFile)

      await fs.writeFile(dataPath, JSON.stringify([], null, 2), 'utf8')

      return { ok: true, path: dataPath, data: [] }
    } catch (err) {
      console.error('Failed to remove all data', err)
      return { ok: false, error: String(err) }
    }
  })

  // Save/replace entire data array to any data file
  ipcMain.handle('data:save', async (_event, dataFile: string, data: any) => {
    try {
      const fs = await import('fs/promises')
      const dataPath = getDataFilePath(dataFile)

      await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8')

      return { ok: true, path: dataPath, data }
    } catch (err) {
      console.error('Failed to save data', err)
      return { ok: false, error: String(err) }
    }
  })

  // Load data from any data file
  ipcMain.handle('data:load', async (_event, dataFile: string) => {
    try {
      const fs = await import('fs/promises')
      const dataPath = getDataFilePath(dataFile)

      let raw = '[]'
      try {
        raw = await fs.readFile(dataPath, 'utf8')
      } catch (e) {
        // File doesn't exist, return empty array
        return { ok: true, path: dataPath, data: [] }
      }

      let arr: any[] = []
      try {
        arr = JSON.parse(raw)
        if (!Array.isArray(arr)) arr = []
      } catch (e) {
        arr = []
      }

      return { ok: true, path: dataPath, data: arr }
    } catch (err) {
      console.error('Failed to load data', err)
      return { ok: false, error: String(err) }
    }
  })
})
```
