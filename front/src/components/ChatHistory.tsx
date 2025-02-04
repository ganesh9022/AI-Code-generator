import { Box, ScrollArea, Text, Paper, Flex, Collapse, Stack, ActionIcon } from "@mantine/core";
import { useClickOutside } from '@mantine/hooks';
import { ChatMessage } from "./Chat";
import { IconMessage, IconX, IconTrash } from "@tabler/icons-react";
import useLazyApi, { BackendEndpoints} from "../hooks/useLazyApi";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface ChatHistoryProps {
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

interface ChatHistoriesResponse {
    histories: Record<string, ChatMessage[]>;
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
    const { data: allHistoriesData, fetchData: fetchAllHistories, loading } = useLazyApi<ChatHistoriesResponse>(BackendEndpoints.AllChatHistories);
    const navigate = useNavigate();
    const [pageUuids, setPageUuids] = useState<string[]>([]);
    const [chatTitles, setChatTitles] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadPageData = async () => {
            if (!opened || !userId) return;

            try {
                await fetchAllHistories({
                    params: { userId },
                });
            } catch (err) {
                console.error("Error loading chat histories:", err);
            }
        };

        if (opened) {
            loadPageData();
        }
    }, [opened, userId]);

    useEffect(() => {
        if (!allHistoriesData?.histories || !opened) return;

        const histories = allHistoriesData.histories;
        const uuids = Object.keys(histories);
        uuids.sort((a, b) => {
            const timestampA = histories[a][histories[a].length - 1]?.timestamp ?? 0;
            const timestampB = histories[b][histories[b].length - 1]?.timestamp ?? 0;
            return new Date(timestampB).getTime() - new Date(timestampA).getTime();
        });

        setPageUuids(uuids);
        const titles: Record<string, string> = {};
        for (const [pageUuid, messages] of Object.entries(histories)) {
            const firstUserMessage = messages.find(msg => msg.type === "sent");
            titles[pageUuid] = firstUserMessage
                ? firstUserMessage.content.length > 10
                    ? `${firstUserMessage.content.slice(0, 23)}...`
                    : firstUserMessage.content
                : 'New Chat';
        }
        setChatTitles(titles);
    }, [allHistoriesData, opened]);

    const isValidPage = (pageUuid: string) => {
        return pageUuids.includes(pageUuid);
    };

    const handleChatSelection = async (pageUuid: string) => {
        if (!isValidPage(pageUuid) || pageUuid === currentPage) return;
        onSelectChat(pageUuid);
    };

    const handleNewChat = () => {
        setMessages([]);
        const newPageUuid = crypto.randomUUID();
        navigate(`/chat/${newPageUuid}`);
        setCurrentPage(newPageUuid);
        onClose();
    };
    const handleDeletePage = async (pageUuid: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPageUuids(prev => prev.filter(uuid => uuid !== pageUuid));

        try {
            await deletePage({
                method: "DELETE",
                params:{ userId, pageUuid },
            });

            // If this is the last page or current page
            if (pageUuids.length <= 1 || currentPage === pageUuid) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Error deleting page:", error);
            // Revert on error
            setPageUuids(prev => [...prev, pageUuid]);
        }
    };

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
                        {loading ? (
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
                                            <Text size="sm" truncate>
                                                {chatTitles[pageUuid] || 'Loading...'}
                                            </Text>
                                        </Flex>
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            onClick={(e) => handleDeletePage(pageUuid, e)}
                                            mr="5px"
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
