import { SignInButton, SignUpButton } from "@clerk/clerk-react"
import { Button, Flex, Title } from "@mantine/core"

export function WelcomePage() {

  return (
      <Flex
        direction="column"
        justify="center"
        align="center"
        h={"100vh"}
        style={{ textAlign: "center" }}
      >
        <Title
          order={1}
          style={{
            fontSize: "4.0rem",
            background: "linear-gradient(90deg, #fefe69, #57e86b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Welcome to Code Creator
        </Title>
        <Flex direction="row" gap="md">
        <SignInButton>
        <Button
            mt="lg"
            variant="gradient"
            gradient={{ from: "yellow", to: "green" }}
            size="md"
        >Sign In
        </Button>
        </SignInButton>
        <SignUpButton>
        <Button
            mt="lg"
            variant="gradient"
            gradient={{ from: "yellow", to: "green" }}
            size="md"
        >Sign Up
        </Button>
        </SignUpButton>
        </Flex>
      </Flex>
  )
}
