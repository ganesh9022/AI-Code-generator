import { useState } from "react"
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
    useMantineColorScheme
} from "@mantine/core"
import { IconArrowRight, IconCopy } from "@tabler/icons-react"
import { Editor } from "@monaco-editor/react"
import ReactMarkdown from "react-markdown"
import axios from "axios"
import { useTools } from "./CodeCompletionToolsProviders"
type ChatMessage = {
    type: "sent" | "received"
    content: string
}

export const Chat = () => {
    const [inputValue, setInputValue] = useState("")
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const { selectedModel } = useTools()
    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()
    const [tooltipText, setTooltipText] = useState("Copy to clipboard")
    const bgColor = colorScheme === 'dark' ? '#777777' : "#f0f0f0"
    const textColor = colorScheme === 'dark' ? "white" : "black"
    const handleSendMessage = async () => {
        if (inputValue.trim() === "") return
        const userMessage: ChatMessage = { type: "sent", content: inputValue };
        setChatHistory((prev) => [...prev, userMessage])
        setInputValue("")
        try {
            const response = await axios.get(`http://127.0.0.1:8000/ask-query?model=${selectedModel}&prompt=${inputValue.trim()}`)
            const answer = response.data.answer || response.data || "No answer received."
            const receivedMessage: ChatMessage = { type: "received", content: answer }
            setChatHistory((prev) => [...prev, receivedMessage])
        } catch (error) {
            console.error("Error fetching completion:", error)
            const errorMessage: ChatMessage = {
                type: "received",
                content: "An error occurred while fetching the response. Please try again.",
            };
            setChatHistory((prev) => [...prev, errorMessage])
        }
    }
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code)
        setTooltipText("Copied!")
        setTimeout(() => {
            setTooltipText("Copy to clipboard")
        }, 2000)
    }
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
                            <Text w={700}>{language || "Code"}</Text>
                            <Tooltip label={tooltipText} withArrow>
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    onClick={() => handleCopy(code)}
                                >
                                    <IconCopy size={16} />
                                </ActionIcon>
                            </Tooltip>
                        </Box>
                        <Editor
                            value={code}
                            language={language.toLowerCase()}
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


    return (
        <Flex direction="column" h="calc(100vh - 70px)" p={16}>
            <ScrollArea
                h='90%'
                mb={16}
            >
                <Box style={{ padding: rem(16) }}>
                    {chatHistory.map((message, index) => (
                        <Flex
                            key={index}
                            direction="column"
                            align={message.type === "sent" ? "flex-end" : "flex-start"}
                            mb="sm"
                        >
                            <Paper
                                p={12}
                                maw='70%'
                                style={{
                                    borderRadius: rem(12),
                                    maxWidth: "70%",
                                    backgroundColor:
                                        message.type === "sent" ? "var(--mantine-color-blue-filled)" : bgColor,
                                    color: textColor,
                                }}
                            >
                                {message.type === 'sent' ?
                                    <Box><pre
                                        style={{
                                            fontFamily: 'inherit',
                                            fontSize: 'inherit',
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                            wordWrap: 'break-word',
                                        }}
                                    >{message.content}</pre></Box>
                                    : renderMessageContent(message.content)}
                            </Paper>
                        </Flex>
                    ))}
                </Box>
            </ScrollArea>
            <Flex>
                <Textarea
                    style={{ justifyContent: "flex-end" }}
                    mt='auto'
                    rows={1}
                    w="100%"
                    radius="xl"
                    size="md"
                    value={inputValue}
                    placeholder="Type your message..."
                    onChange={(event) => setInputValue(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.ctrlKey && event.key === "Enter") {
                            handleSendMessage()
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
                            onClick={handleSendMessage}
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
