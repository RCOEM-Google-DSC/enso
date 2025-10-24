'use client'

import * as React from 'react'
import data from '@renderer/context'
import { NavAssets } from '@renderer/components/nav-assets'
import { NavDatabase } from '@renderer/components/nav-data'
import { NavUser } from '@renderer/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail
} from '@renderer/components/ui/sidebar'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavDatabase database={data.database} />
        <NavAssets items={data.Assets} />
      </SidebarContent>
      <SidebarFooter className="mb-4">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
