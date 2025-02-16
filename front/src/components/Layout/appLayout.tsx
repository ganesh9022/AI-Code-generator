import {
  Container,
  useMantineColorScheme,
  AppShell,
  Group,
  Title,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "./appheader";
import { SidebarLink } from "./Sidebar";
import { IconCode, IconChevronLeftPipe } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export const AppLayout = () => {
  const { colorScheme } = useMantineColorScheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const titles: { [key: string]: string } = {
      "/": "AI code generator",
      "/editor": "AI code generator - Editor",
      "/chat": "AI code generator - Chat",
      "/more-options": "AI code generator - More Options",
      "/more-options/github-auth": "AI code generator - GitHub Authentication",
      "/more-options/contextual-response":
        "AI code generator - Contextual Response",
    };

    const title = location.pathname.startsWith("/chat")
      ? "AI code generator - Chat"
      : titles[location.pathname] || "AI code generator - 404";
    document.title = title;
  }, [location]);

  return (
    <AppShell
      header={{ height: 64 }}
      footer={{ height: 0 }}
      navbar={{ width: isCollapsed ? 70 : 200, breakpoint: "sm" }}
      layout="alt"
    >
      <AppHeader />
      <AppShell.Navbar
        withBorder={false}
        bg={colorScheme === "dark" ? "gray.8" : "#134B70"}
        p={8}
        style={{ transition: "width 200ms" }}
      >
        <Group p={8} mt={3} wrap="nowrap">
          <ThemeIcon
            size="sm"
            bg="transparent"
            style={{ textDecoration: "none" }}
          >
            <IconCode />
          </ThemeIcon>
          {!isCollapsed && (
            <Title c="white" size="h3" fw={400} style={{ fontSize: "initial" }}>
              AI code generator
            </Title>
          )}
        </Group>
        <Stack h="100%" justify="space-between" mt={6}>
          <Stack py={16} gap={8}>
            <SidebarLink isCollapsed={isCollapsed} />
          </Stack>
          <ThemeIcon
            size="sm"
            c="gray.4"
            bg="transparent"
            style={{
              transition: "transform 200ms",
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0)",
            }}
            onClick={() => setIsCollapsed((prevCollapsed) => !prevCollapsed)}
          >
            <IconChevronLeftPipe />
          </ThemeIcon>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Container
          fluid
          mih="calc(100dvh - 64px)"
          p={0}
          m={0}
          bg={colorScheme === "dark" ? "gray.9" : "gray.0"}
        >
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
