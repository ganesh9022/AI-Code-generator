import React from "react"
import { Grid, Container } from "@mantine/core"
import CodeCompletionEditor from "./code_complitor"

const EditorPage = () => {
  return (
    <Container fluid>
      <Grid>
        <Grid.Col span={12}>
          <CodeCompletionEditor />
        </Grid.Col>
      </Grid>
    </Container>
  )
}

export default EditorPage
