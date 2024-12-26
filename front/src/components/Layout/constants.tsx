import { IconBrandHipchat, IconEdit } from "@tabler/icons-react"
export type SidebarItem = {
  path?: string
  name: string
  position: "top" | "bottom"
  links?: SidebarItem[]
  tooltip?: string
  icon: React.ElementType
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    path: "chat",
    name: "Chat",
    position: "top",
    icon: IconBrandHipchat,
  },
  {
    path: "editor",
    name: "Code Editor",
    position: "top",
    tooltip: "Explore multi-cloud spend, correlate it to your business growth",
    icon: IconEdit,
  },
]
