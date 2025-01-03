import { useState } from "react"
import { ActionIcon, Box, Flex, TextInput, rem, useMantineTheme } from "@mantine/core"
import { IconArrowRight, IconSearch } from "@tabler/icons-react"
import axios from "axios"
import { useTools } from "./CodeCompletionToolsProviders"

export const    Chat = () => {
    const [inputValue, setInputValue] = useState("")
    const {selectedModel} =useTools()
    const theme = useMantineTheme();
    const [message, setMessage] = useState<string>("")
    const handleSendMessage = async () => {
        if (inputValue.trim() === "") return

        try {
            console.log(inputValue)
            const response = await axios.get(
              `http://127.0.0.1:8000/ask-query?model=${selectedModel}&prompt=${inputValue.trim()}`
            );
            const answer = response.data.answer || "No answer received."
            setMessage(answer)
        } catch (error) {
            console.error("Error fetching completion:", error);
            setMessage("Error fetching completion. Please try again.");
        }
        setInputValue("")
    }

    return (
        <>
        <Box>
            {message}
        </Box>
            <Flex
                h='100%'
                direction='row'
            >
                <TextInput
                    style={{ justifyContent: "flex-end" }}
                    mt='auto'
                    w="100%"
                    radius="xl"
                    size="md"
                    value={inputValue}
                    placeholder="Type your message..."
                    onChange={(event) => setInputValue(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") handleSendMessage();
                    }}
                    rightSectionWidth={42}
                    leftSection={
                        <IconSearch
                            style={{ width: rem(18), height: rem(18) }}
                            stroke={1.5}
                        />
                    }
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
        </>
    )
}
