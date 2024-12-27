import {
  AppShell,
  Button,
  Group,
  rem,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { IconAdjustmentsPlus, IconMoon, IconSun } from "@tabler/icons-react";
import { useMemo } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { SIDEBAR_ITEMS, SidebarItem } from "./constants";
import Tools from "./Tools";
import { useTools } from "../CodeCompletionToolsProviders";

interface FlattenedRoute {
  path: string;
  name: string;
  tooltip?: string;
}
export const AppHeader = () => {
  const location = useLocation();
  const {
    setSelectedModel,
    language,
    setLanguage,
    runCode,
    selectedModel,
    sideDrawerOpen,
    setSideDrawerOpen,
  } = useTools();
  const { pageTitle } = useMemo(() => {
    const flattenRoutes = (
      routes: SidebarItem[],
      basePath = ""
    ): FlattenedRoute[] =>
      routes.flatMap((route) => {
        const fullPath = route.path ? `${basePath}/${route.path}` : basePath;
        const flattened = route.path
          ? [{ path: fullPath, name: route.name, tooltip: route.tooltip }]
          : [];
        const subRoutes = route.links
          ? flattenRoutes(route.links, fullPath)
          : [];
        return [...flattened, ...subRoutes];
      });

    const currentRoute = flattenRoutes(SIDEBAR_ITEMS).find((route) =>
      matchPath(route.path, location.pathname)
    );
    return {
      pageTitle: currentRoute?.name || "",
      tooltipText: currentRoute?.tooltip || "",
    };
  }, [location.pathname]);

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell.Header h={64} bg={colorScheme === "dark" ? "gray.8" : "white"}>
      <Group justify="space-between" align="center" h={64}>
        <Group gap={0} align="center" ml={10}>
          <Title size="h3" mr="xs" fw={600}>
            {pageTitle}
          </Title>
        </Group>
        <Group>
          <Button
            leftSection={
              <IconAdjustmentsPlus
                style={{ width: rem(18), height: rem(18) }}
                stroke={1.5}
              />
            }
            variant="outline"
            children="More options"
            onClick={() => setSideDrawerOpen(!sideDrawerOpen)}
          />
          <Tools
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            language={language}
            setLanguage={setLanguage}
            runCode={runCode}
          />
          <ThemeIcon
            bg={colorScheme === "dark" ? "gray.8" : "white"}
            c={colorScheme === "dark" ? "yellow.8" : "gray.7"}
            onClick={toggleColorScheme}
            mr={10}
          >
            {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
          </ThemeIcon>
        </Group>
      </Group>
    </AppShell.Header>
  );
};
