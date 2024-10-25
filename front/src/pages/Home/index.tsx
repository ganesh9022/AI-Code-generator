import { Button, Flex, Title } from "@mantine/core"
import { useNavigate } from "react-router-dom"

export function HomePage() {
  const navigate = useNavigate()

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

        <Button
          mt="lg"
          variant="gradient"
          gradient={{ from: "yellow", to: "green" }}
          size="md"
          onClick={() => navigate("/editor")}
        >
          Generate Code
        </Button>
      </Flex>
  )
}
