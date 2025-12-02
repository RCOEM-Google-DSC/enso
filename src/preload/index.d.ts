import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      saveTestData?: (data: unknown) => Promise<{ ok: boolean; path?: string }>
      removeTestData?: (id: string) => Promise<{ ok: boolean; path?: string; data?: unknown }>
      // Generalized data operations
      removeData?: (
        dataFile: string,
        id: string
      ) => Promise<{ ok: boolean; path?: string; data?: unknown }>
      addData?: (
        dataFile: string,
        record: unknown
      ) => Promise<{ ok: boolean; path?: string; data?: unknown }>
      removeAllData?: (dataFile: string) => Promise<{ ok: boolean; path?: string; data?: unknown }>
      saveData?: (
        dataFile: string,
        data: unknown
      ) => Promise<{ ok: boolean; path?: string; data?: unknown }>
      loadData?: (dataFile: string) => Promise<{ ok: boolean; path?: string; data?: unknown }>
    }
    discord: {
      setActivity: (options: {
        details: string
        state: string
        largeImageKey: string
        largeImageText: string
        smallImageKey: string
        smallImageText: string
      }) => Promise<void>
      isConnected: () => Promise<boolean>
    }
  }
}
