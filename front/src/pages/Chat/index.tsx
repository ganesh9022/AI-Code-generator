import { Box } from "@mantine/core"
import { Chat } from "../../components/Chat"

export default function ChatPage() {

    return (
        <Box h="88vh" p={12}
            style={{ justifyContent: 'center', }}>
            <Chat />
        </Box>
    )
}