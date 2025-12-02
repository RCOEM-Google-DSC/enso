//  LATER WILL BE CONVERTED INTO UPDATE STATUS COMPONENT

import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@renderer/components/ui/sidebar'
//  Direct for now later will implement dynamic user ico - User Auth
import icon from '@renderer/assets/icons/icon.png'
export function NavUser({
  user
}: {
  user: {
    name: string
    ico: string
    email: string
  }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={icon} alt={user.name} />
            <AvatarFallback className="rounded-lg">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
