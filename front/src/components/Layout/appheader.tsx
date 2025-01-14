import {
  AppShell,
  Box,
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
import { UserButton } from "@clerk/clerk-react";
import { Model, PageTitle, supported_language_versions } from './types';

interface FlattenedRoute {
  path: string;
  name: PageTitle;
  tooltip?: string;
}
export const AppHeader = () => {
  const location = useLocation();
  const {
    state: { selectedModel, language, sideDrawerOpen },
    updateState,
    runCode,
  } = useTools();
  const { pageTitle } = useMemo(() => {
    const flattenRoutes = (
      routes: SidebarItem[],
      basePath = ""
    ): FlattenedRoute[] =>
      routes.flatMap((route) => {
        const fullPath = route.path ? `${basePath}/${route.path}` : basePath;
        const flattened = route.path
          ? [{ path: fullPath, name: route.name as PageTitle, tooltip: route.tooltip }]
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
      pageTitle: currentRoute?.name || PageTitle.EDITOR,
      tooltipText: currentRoute?.tooltip || "",
    };
  }, [location.pathname]);

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell.Header h={64} bg={colorScheme === "dark" ? "gray.8" : "white"}>
      <Group justify="space-between" align="center" h={64} wrap="nowrap">
        <Group gap={0} align="center" ml={10}>
          <Title size="h3" mr="xs" fw={600}>
            {pageTitle}
          </Title>
        </Group>
        <Group gap={0} wrap="nowrap">
          {pageTitle !== PageTitle.CHAT && (
            <Button
              leftSection={
                <IconAdjustmentsPlus
                  style={{ width: rem(18), height: rem(18) }}
                  stroke={1.5}
                />
              }
              variant="outline"
              children="More options"
              onClick={() => updateState("sideDrawerOpen", !sideDrawerOpen)}
            />
          )}
          <Tools
            selectedModel={selectedModel}
            setSelectedModel={(model: Model) => updateState('selectedModel', model)}
            language={language}
            setLanguage={(language: keyof typeof supported_language_versions) => updateState('language', language)}
            runCode={runCode}
            pageTitle={pageTitle}
          />
          <ThemeIcon
            bg={colorScheme === "dark" ? "gray.8" : "white"}
            c={colorScheme === "dark" ? "yellow.8" : "gray.7"}
            onClick={toggleColorScheme}
            mr={10}
          >
            {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
          </ThemeIcon>
          <Box style={{ marginRight: "5px", marginTop: "5px" }}>
            <UserButton />
          </Box>
        </Group>
      </Group>
    </AppShell.Header>
  );
};
