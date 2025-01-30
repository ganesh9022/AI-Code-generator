import { Box, Button, Group, Text, Title, Paper, Stack, ThemeIcon, useMantineColorScheme, Switch } from "@mantine/core";
import { IconBrandGithub, IconFileText, IconArrowRight, IconBrain } from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { useGithubToken } from "../../hooks/useGithubToken";
import { RequestStatus } from "../../components/Layout/types";
import { useUser } from "@clerk/clerk-react";

export default function MoreOptions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { colorScheme } = useMantineColorScheme();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const { tokenStatus } = useGithubToken(email);
  const { state: { toggle }, updateState, params, setParams } = useTools();
  const isRootPath = location.pathname === '/more-options';

  if (!isRootPath) {
    return null;
  }

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToggleValue = event.currentTarget.checked;
    updateState("toggle", newToggleValue);

    setParams({
      ...params,
      toggle: newToggleValue,
    });
  };

  return (
    <Box h="88vh" p={24} style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Stack gap="xl">
        <Stack gap="xs" align="center">
          <Paper 
            withBorder
            p="md" 
            radius="md"
            style={{ 
              backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-7)" : "var(--mantine-color-gray-0)",
              width: '100%',
              maxWidth: 600
            }}
          >
            <Stack gap="xs" align="center">
              <Text fw={500} size="sm">Advanced Analysis Mode</Text>
              <Group justify="center" align="center">
                <Group gap="md">
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon size={24} radius={24} color="green" variant="light">
                      <IconBrain size={14} />
                    </ThemeIcon>
                    <Text size="sm">Multi-Layer ML</Text>
                  </Group>
                  {toggle && (
                    <>
                      <Text size="sm" c="dimmed"></Text>
                      <Group gap="xs" wrap="nowrap">
                        <ThemeIcon size={24} radius={24} color="blue" variant="light">
                          <IconBrain size={14} />
                        </ThemeIcon>
                        <Text size="sm">GROQ RAG</Text>
                      </Group>
                    </>
                  )}
                  <Switch
                    checked={toggle}
                    onChange={handleToggleChange}
                    size="md"
                    color="blue"
                  />
                </Group>
              </Group>
            </Stack>
          </Paper>
        </Stack>
        
        <Group gap="lg" align="stretch" grow>
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
            <Stack gap="md" align="center">
              <ThemeIcon size={60} radius={60} color="green" variant="light" style={{ border: '2px solid var(--mantine-color-green-5)' }}>
                <IconBrandGithub size={30} />
              </ThemeIcon>
              <Title order={3}>GitHub Repository Analysis</Title>
              <Text size="sm" c="dimmed" ta="center" maw={300}>
                {toggle 
                  ? "Extract and analyze repository functions using both Multi-Layer ML and GROQ RAG"
                  : "Extract and analyze repository functions using Multi-Layer ML"}
              </Text>
              <Button 
                variant="gradient" 
                gradient={{ from: 'teal', to: 'green', deg: 90 }}
                fullWidth
                size="md"
                rightSection={<IconArrowRight size={18} />}
                leftSection={<IconBrandGithub size={18} />}
                color={tokenStatus?.status === RequestStatus.SUCCESS ? "green" : undefined}
              >
                {tokenStatus?.status === RequestStatus.SUCCESS 
                  ? "Continue to Repository Analysis" 
                  : "Connect with GitHub"}
              </Button>
            </Stack>
          </Paper>

          <Paper 
            shadow="md" 
            p="xl" 
            radius="md"
            style={{ 
              cursor: toggle ? "pointer" : "not-allowed",
              backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "white",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
              opacity: toggle ? 1 : 0.5,
              '&:hover': toggle ? {
                transform: 'translateY(-5px)',
                boxShadow: 'var(--mantine-shadow-lg)',
              } : undefined
            }}
            onClick={() => toggle && navigate('contextual-response')}
          >
            <Stack gap="md" align="center">
              <ThemeIcon size={60} radius={60} color="blue" variant="light" style={{ 
                border: '2px solid var(--mantine-color-blue-5)',
                opacity: toggle ? 1 : 0.5
              }}>
                <IconFileText size={30} />
              </ThemeIcon>
              <Title order={3}>Contextual Response</Title>
              <Text size="sm" c="dimmed" ta="center">
                {toggle 
                  ? "Upload files or folders to train GROQ RAG model for the enhanced contextual responses"
                  : "Enable Advanced Analysis Mode to access GROQ RAG training"}
              </Text>
              <Button 
                variant="gradient" 
                gradient={{ from: 'indigo', to: 'blue', deg: 90 }}
                fullWidth
                size="md"
                rightSection={<IconArrowRight size={18} />}
                leftSection={<IconFileText size={18} />}
                disabled={!toggle}
              >
                {toggle ? "Upload & Train GROQ Model" : "Advanced Analysis Mode Required"}
              </Button>
            </Stack>
          </Paper>
        </Group>
      </Stack>
    </Box>
  );
}
