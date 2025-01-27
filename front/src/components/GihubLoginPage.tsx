import { Box, Button, Paper, TextInput, Stack, ThemeIcon, Title, Text, useMantineColorScheme, Progress, Group, Switch } from "@mantine/core";
import { useEffect, useState } from "react";
import useGitHubOAuth from "../hooks/useGitHubOAuth";
import { useGithubToken } from "../hooks/useGithubToken";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import React from "react";
import { IconBrandGithub, IconCheck, IconClock, IconArrowLeft, IconLink, IconCode, IconBrain } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import useLazyApi, { BackendEndpoints, FetchOptions } from "../hooks/useLazyApi";
import { RequestStatus } from "./Layout/types";
import { useTools } from "../components/CodeCompletionToolsProviders";

const encodeCode = (code: string): string => {
    return btoa(code);
};

interface ExtractFunctionsResponse {
    status: RequestStatus;
    message?: string;
}

export default function GithubLoginPage() {
    const [repoUrl, setRepoUrl] = useState("");
    const processedCode = React.useRef<string | null>(null);
    const { user } = useUser();
    const { handleLogin } = useGitHubOAuth();
    const { colorScheme } = useMantineColorScheme();
    const location = useLocation();
    const navigate = useNavigate();
    const email = user?.primaryEmailAddress?.emailAddress;
    const { state: { toggle } } = useTools();
    
    const { 
        tokenStatus, 
        timeLeft, 
        handleTokenRequest, 
        isLoading: isTokenLoading 
    } = useGithubToken(email);

    const {
        fetchData: extractFunctions,
        loading: isExtracting,
        error: extractError,
        data: extractResponse
    } = useLazyApi<ExtractFunctionsResponse>(BackendEndpoints.ExtractRepoFunctions);

    // Check for OAuth callback on mount and URL changes
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get("code");
        
        if (code && processedCode.current !== code && email) {
            processedCode.current = code;
            const encodedCode = encodeCode(code);
            handleTokenRequest(encodedCode);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [location.search, email, handleTokenRequest]);

    const handleExtractFunctions = async () => {
        if (!repoUrl.trim()) {
            toast.error("Please enter a repository URL");
            return;
        }

        if (!email) {
            toast.error("No email address found in user profile");
            return;
        }

        const options = {
            data: {
                repo_url: repoUrl,
                email,
                enable_contextual: toggle
            }
        };

        await extractFunctions(options);
    };

    // Handle extract functions response
    useEffect(() => {
        if (extractResponse) {
            if (extractResponse.status === RequestStatus.SUCCESS) {
                toast.success(extractResponse.message || "Repository processed successfully!");
            } else {
                toast.error(extractResponse.message || "Failed to process repository");
            }
        }
        if (extractError) {
            toast.error("Failed to process repository: " + extractError);
        }
    }, [extractResponse, extractError]);

    return (
        <Box 
            style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 60px)', // Account for header height
                padding: '16px'
            }}
        >
            <Paper 
                withBorder 
                shadow="md"
                p="xl" 
                radius="md" 
                style={{ 
                    width: '100%',
                    maxWidth: 600,
                    backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "white"
                }}
            >
                <Stack gap="lg">
                    <Stack gap="xs" align="center">
                        <ThemeIcon size={80} radius={80} color="green" variant="light" style={{ border: '2px solid var(--mantine-color-green-5)' }}>
                            <IconBrandGithub size={40} />
                        </ThemeIcon>
                        <Title order={2}>GitHub Repository Analysis</Title>
                        <Text size="sm" c="dimmed" ta="center" maw={400}>
                            {toggle 
                                ? "Extract and analyze repository functions using both Multi-Layer and GROQ RAG "
                                : "Extract and analyze repository functions using Multi-Layer ML (JSON)"}
                        </Text>
                        {toggle && (
                            <Group gap="xs">
                                <ThemeIcon size={24} radius={24} color="blue" variant="light">
                                    <IconBrain size={14} />
                                </ThemeIcon>
                                <Text size="sm" c="blue">Dual Analysis Mode: ML + GROQ</Text>
                            </Group>
                        )}
                    </Stack>

                    <form onSubmit={(e) => e.preventDefault()}>
                        <Stack gap="md">
                            {/* GitHub Status */}
                            <Paper withBorder p="md" radius="md" style={{
                                backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-7)" : "var(--mantine-color-gray-0)"
                            }}>
                                <Stack gap="xs">
                                    {tokenStatus?.status === RequestStatus.SUCCESS ? (
                                        <>
                                            <Group>
                                                <ThemeIcon size={24} radius={24} color="green" variant="light">
                                                    <IconCheck size={14} />
                                                </ThemeIcon>
                                                <Text fw={500}>GitHub Connected</Text>
                                            </Group>
                                            {tokenStatus.expiresAt && (
                                                <Group gap="xs" align="center">
                                                    <IconClock size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                                    <Text size="sm" c="dimmed">Token expires in: {timeLeft || 'Calculating...'}</Text>
                                                </Group>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Text fw={500}>GitHub Authorization Required</Text>
                                            <Button
                                                variant="light"
                                                color="green"
                                                leftSection={<IconBrandGithub size={18} />}
                                                onClick={() => {
                                                    processedCode.current = null;
                                                    handleLogin();
                                                }}
                                                loading={isTokenLoading}
                                                fullWidth
                                            >
                                                Connect with GitHub
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Repository Input */}
                            {tokenStatus?.status === RequestStatus.SUCCESS && (
                                <>
                                    <TextInput
                                        placeholder="https://github.com/username/repository"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        required
                                        size="md"
                                        leftSection={<IconLink size={18} />}
                                        styles={{
                                            input: {
                                                '&:disabled': {
                                                    opacity: 0.5,
                                                    backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)'
                                                }
                                            }
                                        }}
                                    />

                                    {/* Analysis Mode Info */}
                                    <Paper withBorder p="md" radius="md" style={{
                                        backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-7)" : "var(--mantine-color-gray-0)"
                                    }}>
                                        <Group justify="apart" align="center">
                                            <Text fw={500}>Current Analysis Mode:</Text>
                                            <Group gap="md">
                                                <Group gap="xs" wrap="nowrap">
                                                    <ThemeIcon size={24} radius={24} color="green" variant="light">
                                                        <IconBrain size={14} />
                                                    </ThemeIcon>
                                                    <Text size="sm">Multi-Layer ML</Text>
                                                </Group>
                                                {toggle && (
                                                    <>
                                                        <Text size="sm" c="dimmed">+</Text>
                                                        <Group gap="xs" wrap="nowrap">
                                                            <ThemeIcon size={24} radius={24} color="blue" variant="light">
                                                                <IconBrain size={14} />
                                                            </ThemeIcon>
                                                            <Text size="sm">GROQ RAG</Text>
                                                        </Group>
                                                    </>
                                                )}
                                            </Group>
                                        </Group>
                                    </Paper>

                                    {/* Process Button */}
                                    <Button 
                                        onClick={handleExtractFunctions}
                                        loading={isExtracting}
                                        disabled={!repoUrl.trim()}
                                        variant="gradient"
                                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                        fullWidth 
                                        size="md"
                                        leftSection={<IconCode size={20} />}
                                    >
                                        {isExtracting ? 'Processing Repository...' : (toggle ? 'Process with Dual Analysis' : 'Process with ML Analysis')}
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </form>

                    <Button 
                        variant="subtle" 
                        fullWidth 
                        size="md" 
                        onClick={() => navigate('/more-options')}
                        color="gray"
                        leftSection={<IconArrowLeft size={18} />}
                    >
                        Back to Options
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
