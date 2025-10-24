import { useEffect, useState } from 'react'
import { Highlighter } from '@renderer/components/ui/highlighter'
const Preloader: React.FC = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000) // 3 seconds
    return () => clearTimeout(timer)
  }, [])

  if (!loading) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 15s ease'
      }}
    >
      <div className="text-center">
        <p className="text-2xl font-medium text-gray-800 mb-2">
          Welcome to{' '}
          <Highlighter action="underline" color="#FF9800">
            GDG enso
          </Highlighter>
          — a fast, beautiful desktop experience. Loading your workspace.{' '}
          <Highlighter action="highlight" color="#87CEFA">
            Almost there...
          </Highlighter>
        </p>
      </div>
    </div>
  )
}

export default Preloader
