import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
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

  // Remove a single record by id.
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

  // Add a new record to the specified data file
  addData: (
    dataFile: string,
    record: unknown
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:add', dataFile, record),

  // Remove all records from the specified data file
  removeAllData: (
    dataFile: string
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:removeAll', dataFile),

  // Save staged changes/replace entire data array to the specified data file
  saveData: (
    dataFile: string,
    data: unknown
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:save', dataFile, data),

  // Load data from the specified data file at the start
  loadData: (
    dataFile: string
  ): Promise<{
    ok: boolean
    path?: string
    data?: unknown
  }> => ipcRenderer.invoke('data:load', dataFile)
}
const discord = {
  setActivity: (options: {
    details: string
    state: string
    largeImageKey: string
    largeImageText: string
    smallImageKey: string
    smallImageText: string
  }): Promise<void> => ipcRenderer.invoke('discord:setActivity', options),
  isConnected: (): Promise<boolean> => ipcRenderer.invoke('discord:isConnected')
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('discord', discord)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.discord = discord
}
