import { Container } from "@mantine/core";
import CodeCompletionEditor from "./codeCompletion";

const EditorPage = () => {
  return (
    <Container fluid p={0}>
      <CodeCompletionEditor />
    </Container>
  );
};

export default EditorPage;
