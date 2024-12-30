import React, { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Paper, Title } from "@mantine/core";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { CompletionFormatter } from "../../components/completion-formatter";
import useApi from "../../hooks/useApi";
import { File } from "../../utils/file-manager";
const CodeCompletionEditor = ({ selectedFile }: { selectedFile?: File }) => {
  const { language, editorRef, output, params, setParams,code } = useTools();
  const monaco = useMonaco();
  const { data } = useApi("code-snippet", params);

  useEffect(() => {
    if (!monaco || !selectedFile) return;

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

  const selectedFileContent = selectedFile?.content;

  return (
    <div style={{ height: "90vh" }}>
      <Paper style={{ display: "flex", height: "100%" }}>
        <Paper w={output ? "50%" : "100%"}>
          <Editor
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            theme="vs-dark"
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
