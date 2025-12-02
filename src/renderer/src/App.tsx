import TitleBar from '@renderer/components/TitleBar'
import { AppSidebar } from '@renderer/components/app-sidebar'
import { Separator } from '@renderer/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@renderer/components/ui/sidebar'
import DataPage from '@renderer/pages/DataPage'
import TestDataPage from '@renderer/pages/TestDataPage'
import DataConversionPage from '@renderer/pages/DataConversionPage'
// import Preloader from '@renderer/components/preloader'
// import { useEffect, useState } from 'react'

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'

  // const [showApp, setShowApp] = useState(false)

  // useEffect(() => {
  //   const timer = setTimeout(() => setShowApp(true), 1500) // 1.5 seconds
  //   return () => clearTimeout(timer)
  // }, [])

  // if (!showApp) {
  //   return <Preloader />
  // }

  return (
    <div className="flex flex-col h-screen">
      <TitleBar />
      <div className="flex-1 overflow-auto">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Data Visualization & Statistics
                </span>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {path === '/data' ? (
                <DataPage />
              ) : path === '/test-data' ? (
                <TestDataPage />
              ) : path === '/data-conversion' ? (
                <DataConversionPage />
              ) : (
                <>
                  <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="bg-muted/50 aspect-video rounded-xl" />
                    <div className="bg-muted/50 aspect-video rounded-xl" />
                    <div className="bg-muted/50 aspect-video rounded-xl" />
                  </div>
                  <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
                </>
              )}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
