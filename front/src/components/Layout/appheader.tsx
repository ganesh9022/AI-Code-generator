import {
  AppShell,
  Group,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { useMemo } from "react"
import { matchPath, useLocation } from "react-router-dom"
import { SIDEBAR_ITEMS, SidebarItem } from "./constants"

interface FlattenedRoute {
  path: string
  name: string
  tooltip?: string
}
export const AppHeader = () => {
  const location = useLocation()

  const { pageTitle } = useMemo(() => {
    const flattenRoutes = (
      routes: SidebarItem[],
      basePath = ""
    ): FlattenedRoute[] =>
      routes.flatMap((route) => {
        const fullPath = route.path ? `${basePath}/${route.path}` : basePath
        const flattened = route.path
          ? [{ path: fullPath, name: route.name, tooltip: route.tooltip }]
          : []
        const subRoutes = route.links
          ? flattenRoutes(route.links, fullPath)
          : []
        return [...flattened, ...subRoutes]
      })

    const currentRoute = flattenRoutes(SIDEBAR_ITEMS).find((route) =>
      matchPath(route.path, location.pathname)
    )
    return {
      pageTitle: currentRoute?.name || "",
      tooltipText: currentRoute?.tooltip || "",
    }
  }, [location.pathname])

  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
      <AppShell.Header h={64} bg={colorScheme === "dark" ? "gray.8" : "white"}>
        <Group px={32} py={16} justify="space-between">
          <Group gap={0} align="center">
            <Title size="h3" mr="xs" fw={600}>
              {pageTitle}
            </Title>
          </Group>
          <Group>
            <ThemeIcon
              bg={colorScheme === "dark" ? "gray.8" : "white"}
              c={colorScheme === "dark" ? "yellow.8" : "gray.7"}
              onClick={toggleColorScheme}
            >
              {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
            </ThemeIcon>
          </Group>
        </Group>
      </AppShell.Header>
  )
}
