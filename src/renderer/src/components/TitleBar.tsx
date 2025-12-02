import { JSX, useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'

export default function TitleBar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    checkMaximized()
  }, [])

  const checkMaximized = async () => {
    const maximized = await window.electron.ipcRenderer.invoke('window:isMaximized')
    setIsMaximized(maximized)
  }

  const handleMinimize = (): void => {
    window.electron.ipcRenderer.send('window:minimize')
  }

  const handleMaximize = (): void => {
    window.electron.ipcRenderer.send('window:maximize')
    setTimeout(checkMaximized, 100)
  }

  const handleClose = (): void => {
    window.electron.ipcRenderer.send('window:close')
  }

  return (
    <header className="flex h-8 w-full items-center justify-between bg-background border-b border-border select-none draggable">
      <div className="flex items-center gap-2 px-3">
        <span className="text-xs font-medium">Enso</span>
      </div>
      <div className="flex h-full no-drag">
        <button
          onClick={handleMinimize}
          className="flex h-full w-10 items-center justify-center hover:bg-muted transition-colors focus:outline-none"
          title="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-full w-10 items-center justify-center hover:bg-muted transition-colors focus:outline-none"
          title="Maximize"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-full w-10 items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none"
          title="Close"
        >
          <X className="h-4 w-4 hover:text-gray-50" />
        </button>
      </div>
    </header>
  )
}
