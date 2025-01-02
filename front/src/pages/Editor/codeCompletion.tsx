import React, { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Box, Divider, Paper, Title, useMantineColorScheme } from "@mantine/core";
import { MdClose } from "react-icons/md";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { CompletionFormatter } from "../../components/completion-formatter";
import useApi from "../../hooks/useApi";
import { File } from "../../utils/file-manager";
const CodeCompletionEditor = ({ selectedFile, setSelectedFile }: { selectedFile?: File, setSelectedFile: (file: File | undefined) => void; }) => {
  const { language, editorRef, output, params, setParams, code, isEditorVisible, setIsEditorVisible } = useTools();
  const monaco = useMonaco();
  const { data } = useApi("code-snippet", params);
  const { colorScheme } = useMantineColorScheme()
  useEffect(() => {
    if (!monaco) return;

    const provider = monaco.languages.registerInlineCompletionsProvider(
      language,
      {
        provideInlineCompletions: async (model, position) => {
          if (
            !/[a-zA-Z0-9\s]/.test(model.getValue().charAt(position.column - 2))
          ) {
            return {
              items: [],
            };
          }

          const insertText = (data as string) ?? "";
          return {
            items: [
              {
                insertText,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column - 1,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              },
            ].map((suggestion) =>
              new CompletionFormatter(model, position).format(
                suggestion.insertText,
                suggestion.range
              )
            ),
          };
        },
        freeInlineCompletions: () => { },
      }
    );
    return () => provider.dispose();
  }, [monaco, language, data, selectedFile]);
  const handleClose = () => {
    setIsEditorVisible(false);
  };
  const selectedFileContent = selectedFile?.content;
  const breadcrumbItems = selectedFile?.path?.split("/");
  if (!isEditorVisible) {
    setSelectedFile(undefined)
  }
  return (
    <div style={{ height: "calc(100vh - 70px)" }}>
      {isEditorVisible && (
        <div style={{ height: "3.5vh" }}>
          <div style={{ display: "flex" }}>
            <Box
              style={{
                backgroundColor: "#1e1e1e",
                color: "#ffffff",
                padding: "8px 16px",
                fontWeight: "bold",
              }}
            >
              {selectedFile?.name}
            </Box>
            <MdClose onClick={handleClose} style={{ cursor: "pointer", marginTop: "10px" }} />
          </div>
          <Divider />

        </div>
      )}

      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Box
          style={{
            backgroundColor: "#1e1e1e",
            color: "#ffffff",
            padding: "8px 16px",
            fontSize: "13px",
          }}
        >
          {breadcrumbItems.map((segment, index) => (
            <React.Fragment key={index}>
              <span>{segment}</span>
              {index < breadcrumbItems.length - 1 && (
                <span style={{ margin: "0 8px" }}>&gt;</span>
              )}
            </React.Fragment>
          ))}
        </Box>
      )}

      <Divider />
      <Paper style={{ display: "flex", height: isEditorVisible ? "calc(96.5vh - 104px)" : "calc(100vh - 70px)", overflow: 'auto' }}>
        <Paper w={output ? "50%" : "100%"}>
          <Editor
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            theme={colorScheme === "dark" ? "vs-dark" : "vs"}
            language={language}
            options={{
              autoClosingBrackets: "never",
              autoClosingQuotes: "never",
              formatOnType: true,
              formatOnPaste: true,
              trimAutoWhitespace: true,
            }}
            value={selectedFileContent || code}
            onChange={(value, ev) => {
              if (value) {
                const lineNumber = ev.changes[0].range.startLineNumber;
                const prefix = value.split("\n")[lineNumber - 2] ?? "";
                const currentLine = value.split("\n")[lineNumber - 1] ?? "";
                const suffix = value.split("\n")[lineNumber] ?? "";
                setParams({ ...params, prefix, currentLine, suffix });
              }
            }}
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
