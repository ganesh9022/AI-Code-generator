import React from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Paper, Title } from "@mantine/core";
import { useTools } from "../../components/CodeCompletionToolsProviders";

const CodeCompletionEditor: React.FC = () => {
  const { language, editorRef, output, handleCodeChange } = useTools();

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    editor.onKeyDown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.Enter) {
        e.preventDefault();
        const currentValue = editor.getValue();
        console.log("Editor content changed:", currentValue);
        handleCodeChange(currentValue);
      }
    });
  };

  return (
    <div style={{ height: "90vh" }}>
      <Paper style={{ display: "flex", height: "100%" }}>
        <Paper w={output ? "50%" : "100%"}>
          <Editor
            onMount={handleEditorDidMount}
            theme="vs-dark"
            language={language}
          />
        </Paper>

        {output && (
          <Paper
            w={"50%"}
            p={"10px"}
            style={{
              overflowY: "auto",
            }}
          >
            <Title order={4}>Output:</Title>
            <pre>{output || "No output yet"}</pre>
          </Paper>
        )}
      </Paper>
    </div>
  );
};

export default CodeCompletionEditor;
