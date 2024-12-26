import { Grid, Container } from "@mantine/core";
import CodeCompletionEditor from "./code_complitor";

const EditorPage = () => {
  return (
    <Container fluid p={0}>
      <CodeCompletionEditor />
    </Container>
  );
};

export default EditorPage;
