import { Box, Button, Group, Text, Title, Paper, Stack, ThemeIcon, useMantineColorScheme } from "@mantine/core";
import { IconBrandGithub, IconFileText, IconArrowRight } from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function MoreOptions() {
  const { colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isRootPath = location.pathname === '/more-options';

  if (!isRootPath) {
    return null;
  }

  return (
    <Box h="88vh" p={24} style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Stack>
        <Title order={2} mb="xl" ta="center">
          Additional Features
        </Title>
        
        <Group align="stretch" grow>
          <Paper 
            shadow="md" 
            p="xl" 
            radius="md"
            style={{ 
              cursor: "pointer",
              backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "white",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 'var(--mantine-shadow-lg)',
              }
            }}
            onClick={() => navigate('github-auth')}
          >
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius={60} color="green" variant="light" style={{ border: '2px solid var(--mantine-color-green-5)' }}>
                <IconBrandGithub size={30} />
              </ThemeIcon>
              <Title order={3}>GitHub Repository Analysis</Title>
              <Text size="sm" c="dimmed" ta="center" maw={300}>
                Analyze your GitHub repositories with AI-powered insights and function extraction
              </Text>
              <Button 
                variant="gradient" 
                gradient={{ from: 'teal', to: 'green', deg: 90 }}
                fullWidth
                size="md"
                rightSection={<IconArrowRight size={18} />}
                leftSection={<IconBrandGithub size={18} />}
              >
                Connect with GitHub
              </Button>
            </Stack>
          </Paper>

          <Paper 
            shadow="md" 
            p="xl" 
            radius="md"
            style={{ 
              cursor: "pointer",
              backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "white",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 'var(--mantine-shadow-lg)',
              }
            }}
            onClick={() => navigate('contextual-response')}
          >
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius={60} color="blue" variant="light" style={{ border: '2px solid var(--mantine-color-blue-5)' }}>
                <IconFileText size={30} />
              </ThemeIcon>
              <Title order={3}>Contextual Response</Title>
              <Text size="sm" c="dimmed" ta="center" maw={300}>
                Train our AI model with your files for personalized, context-aware responses
              </Text>
              <Button 
                variant="gradient" 
                gradient={{ from: 'indigo', to: 'blue', deg: 90 }}
                fullWidth
                size="md"
                rightSection={<IconArrowRight size={18} />}
                leftSection={<IconFileText size={18} />}
              >
                Upload & Train Model
              </Button>
            </Stack>
          </Paper>
        </Group>
      </Stack>
    </Box>
  );
}
