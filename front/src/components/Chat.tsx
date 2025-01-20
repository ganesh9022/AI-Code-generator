import { useState, useEffect, useRef } from "react"
import {
    Box,
    Flex,
    Paper,
    ActionIcon,
    rem,
    ScrollArea,
    useMantineTheme,
    Text,
    Textarea,
    Tooltip,
    useMantineColorScheme,
    Button,
    Group,
    List
} from "@mantine/core"
import { IconArrowRight, IconCopy, IconEdit, IconHistory, IconPlus, IconArrowDown } from "@tabler/icons-react"
import { Editor } from "@monaco-editor/react"
import ReactMarkdown from "react-markdown"
import { useTools } from "./CodeCompletionToolsProviders"
import { useAuth } from "@clerk/clerk-react"
import { ChatHistory } from "./ChatHistory"
import { useParams, useNavigate } from 'react-router-dom';
import useLazyApi, { BackendEndpoints} from "../hooks/useLazyApi";

interface SaveMessageResponse {
    success: boolean;
}

interface ChatHistoryResponse {
    messages: ChatMessage[];
}

interface AskQueryResponse {
    answer: string;
}

export type ChatMessage = {
    type: "sent" | "received"
    content: string
    id: string
    pageUuid: string
    timestamp?: string
}

export const Chat = () => {
    const { fetchData: saveMessageApi } = useLazyApi<SaveMessageResponse>(BackendEndpoints.SaveMessage);
    const { data, fetchData: fetchChatHistoryApi } = useLazyApi<ChatHistoryResponse>(BackendEndpoints.ChatHistory);
    const { data: askQueryData, fetchData: askQueryApi } = useLazyApi<AskQueryResponse>(BackendEndpoints.AskQuery);
    const { userId } = useAuth();
    const { pageId, messageId } = useParams<{ pageId: string; messageId: string }>();
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState("")
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const { state: { selectedModel } } = useTools()
    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()
    const [tooltipText, setTooltipText] = useState("Copy to clipboard")
    const bgColor = colorScheme === 'dark' ? '#777777' : "#f0f0f0"
    const textColor = colorScheme === 'dark' ? "white" : "black"
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);      
    const [historyOpened, setHistoryOpened] = useState(false);
    const [currentPage, setCurrentPage] = useState<string>(pageId || crypto.randomUUID());
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadChatHistory = async (pageUuid: string) => {
        if (!userId || !pageUuid) return;
        
        try {
            setIsLoading(true);
            await fetchChatHistoryApi({
              method: "GET",
              params: { userId, pageUuid },
            });            
            if (data?.messages) {
                setChatHistory(data.messages);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
            setChatHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const scrollToMessage = () => {
            if (!messageId || !scrollAreaRef.current) return;
            
            // Add a small delay to ensure the DOM is updated
            setTimeout(() => {
                const messageElement = document.getElementById(`message-${messageId}`);
                if (messageElement && scrollAreaRef.current) {
                    const viewport = scrollAreaRef.current.querySelector('.mantine-ScrollArea-viewport');
                    if (viewport) {
                        const messageTop = messageElement.offsetTop;
                        const viewportHeight = viewport.clientHeight;
                        const scrollPosition = messageTop - (viewportHeight / 2);

                        viewport.scrollTo({
                            top: scrollPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            }, 100);
        };

        if (chatHistory.length > 0 && messageId && typeof messageId === 'string') {
            scrollToMessage();
        }
    }, [messageId, chatHistory]);

    useEffect(() => {
        const loadInitialData = async () => {
            const currentPageId = pageId || currentPage;
            if (currentPageId && typeof userId === 'string') {
                setCurrentPage(currentPageId);
                await loadChatHistory(currentPageId);
                if (!pageId) {
                    navigate(`/chat/${currentPageId}`);
                }
            }
        };
        
        if (userId) {
            loadInitialData();
        }
    }, [pageId, userId]);

    // Update chat history when data changes
    useEffect(() => {
        if (data?.messages) {
            setChatHistory(data.messages);
        }
    }, [data]);

    const handleEditMessage = (messageId: string, content: string) => {
        setEditingMessageId(messageId);
        setInputValue(content);
    };

    const saveMessage = async (messageDetails: {
        userId: string,
        messageId: string,
        content: string,
        type: "sent" | "received",
        pageUuid: string
    }) => {
        return await saveMessageApi({
            data: messageDetails
        });
    };

    const addMessageToHistory = (message: ChatMessage) => {
        setChatHistory(prev => [...prev, {
            type: message.type,
            content: message.content,
            id: message.id,
            pageUuid: message.pageUuid,
            timestamp: message.timestamp
        }]);
    };

    useEffect(() => {
        const addMessage = async () => {
            if (askQueryData?.answer) {
                const aiMessageId = `${Date.now()}_ai`;
                await saveMessage({
                    userId,
                    messageId: aiMessageId,
                    content: askQueryData.answer,
                    type: "received",
                    pageUuid: currentPage,
                });
    
                addMessageToHistory({
                    type: "received",
                    content: askQueryData.answer,
                    id: aiMessageId,
                    pageUuid: currentPage,
                    timestamp: new Date().toISOString()
                });
            }
        };
    
        addMessage();
    }, [askQueryData]);

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setInputValue("");
    };

    const scrollToBottom = () => {
        const viewport = scrollAreaRef.current?.querySelector('.mantine-ScrollArea-viewport');
        if (viewport) {
            viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const handleMessage = async () => {
        if (inputValue.trim() === "" || !userId) return;
        
        const messageId = Date.now().toString();
        const userMessage: ChatMessage = {
            type: "sent",
            content: inputValue.trim(),
            id: messageId,
            pageUuid: currentPage,
            timestamp: new Date().toISOString(),
        };

        try {
            const saveAndAddMessage = async (message: ChatMessage) => {
            await saveMessage({
                userId,
                messageId: message.id,
                content: message.content,
                type: message.type,
                pageUuid: currentPage
            });
                setTimeout(scrollToBottom, 100);
            };
            // Save user message
            await saveAndAddMessage(userMessage);
            // Update chat history
            if (editingMessageId) {
                // Find the index of the edited message
                const messageIndex = chatHistory.findIndex(msg => msg.id === editingMessageId);
                if (messageIndex !== -1) {
                    // Keep only messages up to the edited message and add the new message
                    setChatHistory(prev => {
                        const beforeMessages = prev.slice(0, messageIndex);
                        return [...beforeMessages, userMessage];
                    });
                }
            } else {
                addMessageToHistory(userMessage);
            }

            // Reset input state
            setInputValue("");
            setEditingMessageId(null);

            await askQueryApi({
                method: "POST",
                data: {
                    model: selectedModel,
                    prompt: inputValue.trim(),
                },
            });
        } catch (error) {
            console.error("Error handling message:", error);
        }
    };

    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        setTooltipText("Copied!");
        setTimeout(() => {
            setTooltipText("Copy to clipboard");
        }, 2000);
    };

    const renderMessageContent = (content: string) => {
        return content.split(/```/).map((part, index) => {
            if (index % 2 === 1) {
                const [language, ...codeLines] = part.trim().split('\n');
                const code = codeLines.join('\n');
                return (
                    <Box
                        key={index}
                        mt="xs"
                        bg={colorScheme === 'dark' ? '#555555' : '#BFBFBF'}
                        style={{
                            borderRadius: 8,
                            position: "relative",
                            overflow: "hidden",
                        }}
                        h="fit-content"
                    >
                        <Box
                            p={8}
                            display="flex"
                            style={{
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderRadius: 8,
                            }}
                        >
                            <Text w={700}>{language || "text"}</Text>
                            <Tooltip label={tooltipText} withArrow>
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    onClick={() => handleCopyMessage(code)}
                                >
                                    <IconCopy size={16} />
                                </ActionIcon>
                            </Tooltip>
                        </Box>
                        <Editor
                            value={code}
                            language={language?.toLocaleLowerCase() || "text"}
                            theme={colorScheme === "dark" ? "vs-dark" : "vs"}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                automaticLayout: true,

                            }}
                            onMount={(editor) => {
                                const contentHeight = Math.min(editor.getContentHeight(), 400)
                                editor.layout({
                                    width: editor.getLayoutInfo().width,
                                    height: contentHeight,
                                });
                                const editorElement = editor.getDomNode();
                                if (editorElement) {
                                    editorElement.addEventListener(
                                        "wheel",
                                        (event) => {
                                            const deltaY = event.deltaY
                                            const scrollContainer = document.querySelector(".mantine-ScrollArea-viewport")
                                            scrollContainer?.scrollBy({ top:deltaY})
                                        },
                                    )
                                }
                            }}
                        />
                    </Box>
                )
            }
            return (
                <Box key={index} mt="xs">
                    <ReactMarkdown>{part.trim()}</ReactMarkdown>
                </Box>
            )
        })
    }

    const handleNewChat = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newPageUuid = crypto.randomUUID();
        setCurrentPage(newPageUuid);
        setChatHistory([]);
        setInputValue('');
        setEditingMessageId(null);
        navigate(`/chat/${newPageUuid}`);
        setHistoryOpened(false);
    };

    const handleSelectPage = async (pageUuid: string) => {
        if (pageUuid === currentPage) {
            setHistoryOpened(false);
            return;
        }
        setCurrentPage(pageUuid);
        setInputValue('');
        setEditingMessageId(null);
        await loadChatHistory(pageUuid);
        navigate(`/chat/${pageUuid}`);
        setHistoryOpened(false);
    };

    const handlePageChange = (newPageId: string) => {
        if (newPageId === currentPage) return;
        setCurrentPage(newPageId);
        setInputValue('');
        setEditingMessageId(null);
        loadChatHistory(newPageId);
        navigate(`/chat/${newPageId}`);
    };

    const handleMessageClick = (message: ChatMessage) => {
        const url = `/chat/${currentPage}/${message.id}`;
        navigate(url);
        window.history.pushState({}, '', url);
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setShowScrollButton(!isNearBottom);
    };

    return (
        <Flex direction="column" h="calc(99vh - 70px)" pl={10} pr={10} pb={10} pt={0}>
            <Group style={{ position: 'relative', zIndex: 1 }}>
                <Group p={2}>
                    <Button
                        p={3}
                        variant="subtle"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setHistoryOpened(true);
                        }}
                        loading={isLoading}
                    >
                        <IconHistory size={20} />
                        History
                    </Button>
                    <Button
                        p={3}
                        variant="subtle"
                        onClick={handleNewChat}
                    >
                        <IconPlus size={20} />
                        New Chat
                    </Button>
                </Group>
            </Group>

            <ChatHistory
                chatHistory={chatHistory}
                onSelectChat={handleSelectPage}
                opened={historyOpened}
                currentPage={currentPage}
                onClose={() => setHistoryOpened(false)}
                userId={typeof userId === 'string' ? userId : ''}
                setCurrentPage={handlePageChange}
                setMessages={setChatHistory}
            />

            <ScrollArea
                ref={scrollAreaRef}
                h='90%'
                mb={16}
                onScrollCapture={handleScroll}
                style={{
                    marginLeft: historyOpened ? '300px' : '0',
                    transition: 'margin-left 0.3s ease',
                    position: 'relative'
                }}
            >
                <Box style={{ padding: rem(16) }}>
                    {chatHistory.length === 0 ? (
                        <Flex 
                            direction="column" 
                            align="center" 
                            justify="center" 
                            h="50vh"
                            style={{ textAlign: 'center' }}
                        >
                            <Text size="xl"  mb={8}>
                                Welcome to AI Chat! 👋
                            </Text>
                            <Text mb={16}>
                                Start a conversation by typing a message below.
                            </Text>
                            <Text size="sm">
                                You can:
                                <List>
                                    <List.Item>Ask questions about coding</List.Item>
                                    <List.Item>Get help with debugging</List.Item>
                                    <List.Item>Learn about best practices</List.Item>
                                    <List.Item>Discuss software architecture</List.Item>
                                </List>
                            </Text>
                        </Flex>
                    ) : (
                        chatHistory.map((message) => (
                        <Flex
                            id={`message-${message.id}`}
                            key={message.id}
                            direction="column"
                            align={message.type === "sent" ? "flex-end" : "flex-start"}
                            mb="sm"
                            onClick={() => handleMessageClick(message)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Paper
                                p={12}
                                maw='70%'
                                style={{
                                    borderRadius: rem(16),
                                    borderBottomRightRadius: message.type === "sent" ? 0 : rem(16),
                                    borderTopLeftRadius: message.type === "received" ? 0 : rem(16),
                                    maxWidth: "70%",
                                    backgroundColor:
                                        message.type === "sent"
                                            ? editingMessageId === message.id
                                                ? "var(--mantine-color-blue-7)"
                                                : "var(--mantine-color-blue-filled)"
                                            : bgColor,
                                    color: textColor,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {message.type === 'sent' && (
                                                    <pre
                                        style={{
                                            fontFamily: 'inherit',
                                            fontSize: 'inherit',
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                            wordWrap: 'break-word',
                                        }}
                                                    >
                                                        {message.content}
                                                    </pre>
                                )}
                                {message.type === 'received' && renderMessageContent(message.content)}
                            </Paper>
                            {message.type === 'sent' && (
                                <Box
                                    mt={4}
                                    style={{
                                        width: '70%',
                                        display: 'flex',
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <Flex align="center" gap="xs">
                                        <Tooltip label={tooltipText} withArrow>
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                onClick={() => handleCopyMessage(message.content)}
                                            >
                                                <IconCopy size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            onClick={() => handleEditMessage(message.id, message.content)}
                                        >
                                            <IconEdit size={16} />
                                        </ActionIcon>
                                    </Flex>
                                </Box>
                            )}
                        </Flex>
                        ))
                    )}
                </Box>
                {showScrollButton && (
                    <ActionIcon
                        variant="filled"
                        radius="xl"
                        size="lg"
                        onClick={scrollToBottom}
                        style={{
                            position: 'absolute',
                            bottom: '20px',
                            right: '20px',
                            zIndex: 1000
                        }}
                    >
                        <IconArrowDown size={16} />
                    </ActionIcon>
                )}
            </ScrollArea>
            <Flex style={{
                marginLeft: historyOpened ? '300px' : '0',
                transition: 'margin-left 0.3s ease'
            }}>
                <Textarea
                    style={{ justifyContent: "flex-end" }}
                    mt='auto'
                    rows={1}
                    w="100%"
                    radius="xl"
                    size="md"
                    value={inputValue}
                    placeholder={editingMessageId !== null ? "Edit your message..." : "Type your message..."}
                    onChange={(event) => setInputValue(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleMessage();
                        } else if (event.key === "Escape" && editingMessageId) {
                            handleEditCancel();
                        }
                    }}
                    autosize
                    minRows={1}
                    maxRows={10}
                    rightSectionWidth={42}
                    rightSection={
                        <ActionIcon
                            size={32}
                            radius="xl"
                            variant="filled"
                            onClick={handleMessage}
                            style={{
                                backgroundColor: inputValue
                                    ? theme.colors[theme.primaryColor][6]
                                    : theme.colors.gray[6],
                            }}
                            disabled={!inputValue.trim()}
                        >
                            <IconArrowRight
                                style={{ width: rem(18), height: rem(18) }}
                                stroke={1.5}
                            />
                        </ActionIcon>
                    }
                />
            </Flex>
        </Flex>
    )
}
