import {
  Container,
  useMantineColorScheme,
  AppShell,
  Group,
  Title,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import { Link, Outlet } from "react-router-dom";
import { AppHeader } from "./appheader";
import { SidebarLink } from "./Sidebar";
import { IconCode, IconChevronLeftPipe } from "@tabler/icons-react";
import { useState } from "react";

export const AppLayout = () => {
  const { colorScheme } = useMantineColorScheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AppShell
      header={{ height: 64 }}
      footer={{ height: 0 }}
      navbar={{ width: isCollapsed ? 70 : 220, breakpoint: "sm" }}
      layout="alt"
    >
      <AppHeader />
      <AppShell.Navbar
        withBorder={false}
        bg="gray.7"
        p={12}
        style={{ transition: "width 200ms" }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <Group p={8} wrap="nowrap">
            <ThemeIcon
              size="sm"
              bg="transparent"
              style={{ textDecoration: "none" }}
            >
              <IconCode />
            </ThemeIcon>
            {!isCollapsed && (
              <Title c="white" size="h3" fw={400}>
                Code Creator
              </Title>
            )}
          </Group>
        </Link>
        <Stack h="100%" justify="space-between" mt={32}>
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
