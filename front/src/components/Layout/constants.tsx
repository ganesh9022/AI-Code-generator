export type SidebarItem = {
  path?: string
  name: string
  position: "top" | "bottom"
  links?: SidebarItem[]
  tooltip?: string
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    path: "home",
    name: "Dashboard",
    position: "top",
  },
  {
    path: "editor",
    name: "Code Editor",
    position: "top",
    tooltip: "Explore multi-cloud spend, correlate it to your business growth",
  },
]
