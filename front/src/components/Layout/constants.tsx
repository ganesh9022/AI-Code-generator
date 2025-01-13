import { IconBrandHipchat, IconEdit } from "@tabler/icons-react"
import { PageTitle } from './types';
export type SidebarItem = {
  path?: string
  name: PageTitle
  position: "top" | "bottom"
  links?: SidebarItem[]
  tooltip?: string
  icon: React.ElementType
  badge?: {
    label: string
    color: string
    size?: "xs" | "sm" | "md" | "lg" | "xl"
  };
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    path: "chat",
    name: PageTitle.CHAT,
    position: "top",
    icon: IconBrandHipchat,
  },
  {
    path: "editor",
    name: PageTitle.EDITOR,
    position: "top",
    tooltip: "Explore multi-cloud spend, correlate it to your business growth",
    icon: IconEdit,
  },
]
