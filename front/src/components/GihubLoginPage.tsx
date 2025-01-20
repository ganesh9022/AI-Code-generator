import { Box, Button, Paper, TextInput, Stack, ThemeIcon, Title, Text, useMantineColorScheme, Progress } from "@mantine/core";
import { useEffect, useState } from "react";
import useGitHubOAuth from "../hooks/useGitHubOAuth";
import { useGithubToken } from "../hooks/useGithubToken";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import React from "react";
import { IconBrandGithub, IconCheck, IconClock, IconArrowLeft, IconLink, IconCode } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import useLazyApi, { BackendEndpoints, FetchOptions } from "../hooks/useLazyApi";
import { RequestStatus } from "./Layout/types";

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

        const options: FetchOptions = {
            data: {
                repo_url: repoUrl,
                email
            }
        };

        await extractFunctions(options);
    };

    // Handle extract functions response
    useEffect(() => {
        if (extractResponse) {
            if (extractResponse.status === RequestStatus.SUCCESS) {
                toast.success("Functions extracted successfully!");
            } else {
                toast.error(extractResponse.message || "Failed to extract functions");
            }
        }
        if (extractError) {
            toast.error("Failed to extract functions: " + extractError);
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
                            Connect your GitHub account to analyze repositories and extract functions using AI
                        </Text>
                    </Stack>

                    <form onSubmit={(e) => e.preventDefault()}>
                        <Stack gap="md">
                            {/* Step 1: GitHub Authorization */}
                            <Stack gap="xs">
                                <Text fw={500} size="lg">Step 1: GitHub Authorization</Text>
                                <Box>
                                    <Button 
                                        type="button"
                                        fullWidth 
                                        size="md" 
                                        variant={tokenStatus?.status === RequestStatus.SUCCESS ? 'light' : 'gradient'}
                                        gradient={{ from: 'teal', to: 'green', deg: 90 }}
                                        color={tokenStatus?.status === RequestStatus.SUCCESS ? 'green' : undefined}
                                        leftSection={tokenStatus?.status === RequestStatus.SUCCESS ? <IconCheck size={20} /> : <IconBrandGithub size={20} />}
                                        onClick={() => {
                                            processedCode.current = null;
                                            handleLogin();
                                        }}
                                        loading={isTokenLoading}
                                        disabled={tokenStatus?.status === RequestStatus.SUCCESS}
                                    >
                                        {tokenStatus?.status === RequestStatus.SUCCESS 
                                            ? 'Access Token Active' 
                                            : 'Generate Access Token'}
                                    </Button>
                                    {tokenStatus?.status === RequestStatus.SUCCESS && tokenStatus.expiresAt && (
                                        <Box mt="xs">
                                            <Stack gap="xs">
                                                <Text size="sm" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <IconClock size={16} />
                                                    Token expires in: {timeLeft || 'Calculating...'}
                                                </Text>
                                                <Progress 
                                                    value={((tokenStatus.expiresAt.getTime() - new Date().getTime()) / (tokenStatus.expiresAt.getTime() - new Date(tokenStatus.expiresAt).getTime())) * 100}
                                                    color="green"
                                                    size="sm"
                                                    animated
                                                    striped
                                                />
                                            </Stack>
                                        </Box>
                                    )}
                                </Box>
                            </Stack>

                            {/* Step 2: Repository URL */}
                            <Stack gap="xs">
                                <Text fw={500} size="lg">Step 2: Repository Details</Text>
                                <TextInput
                                    placeholder="https://github.com/username/repository"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    required
                                    size="md"
                                    disabled={tokenStatus?.status !== RequestStatus.SUCCESS}
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
                            </Stack>

                            {/* Step 3: Extract Functions */}
                            <Stack gap="xs">
                                <Text fw={500} size="lg">Step 3: Extract Functions</Text>
                                <Button 
                                    onClick={handleExtractFunctions}
                                    loading={isExtracting}
                                    disabled={!repoUrl.trim() || tokenStatus?.status !== RequestStatus.SUCCESS}
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                    fullWidth 
                                    size="md"
                                    leftSection={<IconCode size={20} />}
                                >
                                    {isExtracting ? 'Extracting Functions...' : 'Start Function Extraction'}
                                </Button>
                            </Stack>
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
