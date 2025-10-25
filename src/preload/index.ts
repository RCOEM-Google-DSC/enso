import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}
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
