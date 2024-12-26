import { Box } from "@mantine/core"
import { Chat } from "../../components/Chat"

export default function ChatPage() {

    return (
        <Box h='80vh' style={{ justifyContent: 'center', }}>
            <Chat />
        </Box>
    )
}