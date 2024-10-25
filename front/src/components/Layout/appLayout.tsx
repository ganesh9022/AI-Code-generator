import { Container, useMantineColorScheme, AppShell } from "@mantine/core"
import { Outlet } from "react-router-dom"
import { AppHeader } from "./appheader"

export const AppLayout = () => {
  const { colorScheme } = useMantineColorScheme()
  return (
    <AppShell header={{ height: 64 }} footer={{ height: 0 }} layout="alt">
      <AppHeader />
      <AppShell.Main>
        <Container
          fluid
          mih="calc(100dvh - 64px)"
          px={32}
          pt={32}
          pb={64}
          bg={colorScheme === "dark" ? "gray.9" : "gray.0"}
        >
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
