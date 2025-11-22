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
