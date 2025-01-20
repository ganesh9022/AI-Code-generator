import { Box, ScrollArea, Text, Paper, Flex, Collapse, Stack, ActionIcon } from "@mantine/core";
import { useClickOutside } from '@mantine/hooks';
import { ChatMessage } from "./Chat";
import { IconMessage, IconX, IconTrash } from "@tabler/icons-react";
import useLazyApi, { BackendEndpoints} from "../hooks/useLazyApi";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface ChatHistoryProps {
    chatHistory: ChatMessage[];
    onSelectChat: (pageUuid: string) => void;
    opened: boolean;
    currentPage: string;
    onClose: () => void;
    userId: string;
    setCurrentPage: (pageUuid: string) => void;
    setMessages: (messages: ChatMessage[]) => void;
}

interface DeletePageResponse {
    success: boolean;
}

interface PageUuidsResponse {
    pageUuids: string[];
}

export const ChatHistory = ({
    onSelectChat,
    opened,
    currentPage,
    onClose,
    userId,
    setCurrentPage,
    setMessages,
}: ChatHistoryProps) => {
    const { fetchData: deletePage } = useLazyApi<DeletePageResponse>(BackendEndpoints.DeletePage);
    const { data: pageUuidsData, fetchData: fetchPageUuids } = useLazyApi<PageUuidsResponse>(BackendEndpoints.PageUuids);
    const navigate = useNavigate();
    const [pageUuids, setPageUuids] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load page UUIDs when opened
    useEffect(() => {
        let isMounted = true;

        const loadPageUuids = async () => {
            if (!opened || !userId || isLoading) return;
            
            setIsLoading(true);
            try {
                await fetchPageUuids({
                    method: "GET",
                    params: { userId },
                });
            } catch (err) {
                console.error("Error loading page UUIDs:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        if (opened) {
            loadPageUuids();
        }

        return () => {
            isMounted = false;
        };
    }, [opened, userId]);

    // Update pageUuids when data changes
    useEffect(() => {
        if (pageUuidsData?.pageUuids) {
            setPageUuids(pageUuidsData.pageUuids);
        }
    }, [pageUuidsData]);

    const isValidPage = (pageUuid: string) => {
        return pageUuids.includes(pageUuid);
    };

    const handleChatSelection = async (pageUuid: string) => {
        if (!isValidPage(pageUuid) || pageUuid === currentPage) return;
        onSelectChat(pageUuid);
    };

    const handleDeletePage = async (pageUuid: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoading) return;
        
        // Optimistically update UI first
        setPageUuids(prev => prev.filter(uuid => uuid !== pageUuid));
        
        try {
            await deletePage({
                method: "DELETE",
                params:{ userId, pageUuid },
            });
            
            // If this is the last page or current page
            if (pageUuids.length <= 1 || currentPage === pageUuid) {
                setMessages([]);
                const newPageUuid = crypto.randomUUID();
                setCurrentPage(newPageUuid);
                navigate(`/chat/${newPageUuid}`);
                onClose();
            }
        } catch (error) {
            console.error("Error deleting page:", error);
            // Revert on error
            setPageUuids(prev => [...prev, pageUuid]);
        }
    };

    // Handle outside clicks
    const ref = useClickOutside(() => {
        if (opened) {
            onClose();
        }
    });

    return (
        <Collapse in={opened}>
            <Paper
                ref={ref}
                w={300}
                h="100vh"
                shadow="md"
                p="md"
                style={{
                    position: 'fixed',
                    left: '200px',
                    top: '64px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Flex justify="space-between" align="center" mb="md">
                    <Text size="lg" fw={500}>Previous Chats ({pageUuids.length})</Text>
                    <ActionIcon onClick={onClose} variant="subtle">
                        <IconX size={18} />
                    </ActionIcon>
                </Flex>
                <ScrollArea h="calc(100vh - 60px)">
                    <Stack>
                        {isLoading && pageUuids.length === 0 ? (
                            <Text ta="center">Loading chats...</Text>
                        ) : pageUuids.length === 0 ? (
                            <Text ta="center" c="dimmed">No previous chats</Text>
                        ) : (
                            pageUuids.map((pageUuid) => (
                                <Box
                                    key={pageUuid}
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor: currentPage === pageUuid ? 'var(--mantine-color-blue-light)' : 'transparent',
                                        borderRadius: '4px',
                                        padding: '8px'
                                    }}
                                >
                                    <Flex align="center" justify="space-between">
                                        <Flex
                                            align="center"
                                            gap="sm"
                                            style={{ flex: 1 }}
                                            onClick={() => handleChatSelection(pageUuid)}
                                        >
                                            <IconMessage size={16} />
                                            <Text size="sm" truncate>Chat {pageUuid.slice(0, 8)}...</Text>
                                        </Flex>
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            onClick={(e) => handleDeletePage(pageUuid, e)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Flex>
                                </Box>
                            ))
                        )}
                    </Stack>
                </ScrollArea>
            </Paper>
        </Collapse>
    );
};
