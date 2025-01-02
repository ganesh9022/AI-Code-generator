import { Box, Group, Flex, UnstyledButton, ThemeIcon,Badge } from "@mantine/core"
import { NavLink } from "react-router-dom"
import { SIDEBAR_ITEMS } from "./constants"

export const SidebarLink = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <>
      {SIDEBAR_ITEMS.map((route) => (
        <UnstyledButton mx="0.3rem" my="0.5rem" key={route.name}>
          <NavLink
            to={route.path || "#"}
            style={({ isActive }) => ({
              color: isActive ? "white" : "grey",
              background: isActive ? "grey" : "transparent",
              textDecoration: "none",
            })}
          >
            <Group justify="space-between" gap={0}>
              <Flex>
                <ThemeIcon bg="transparent" c="inherit" ml="0.3rem" size="sm">
                  {route.icon && <route.icon />}
                </ThemeIcon>
                {!isCollapsed && (
                  <Box pl="0.3rem" ta="left" size="sm">
                    {route.name}
                  </Box>
                )}
              </Flex>
              {!isCollapsed && route.badge && (
                <Badge
                  color={route.badge.color}
                  size={route.badge.size}
                  mr="3.3rem"
                >
                  {route.badge.label}
                </Badge>
              )}
            </Group>
          </NavLink>
        </UnstyledButton>
      ))}
    </>
  )
}