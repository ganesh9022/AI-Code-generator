import React, { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Paper, Title } from "@mantine/core";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { CompletionFormatter } from "../../components/completion-formatter";
import useApi from "../../hooks/useApi";

const CodeCompletionEditor: React.FC = () => {
  const { language, editorRef, output } = useTools();
  const monaco = useMonaco();
  
  const { data, error, loading } = useApi("code-snippet", {
    prompt: "def all_odd_numbers(a,b)",
    suffix: "return result",
  });

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

          return {
            items: [
              {
                insertText: `console.log('Hello, world!');
                kfdbklnf ldfbnfkj
                fbkjfn fdkbnkj`,
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
        freeInlineCompletions: () => {},
      }
    );
    return () => provider.dispose();
  }, [monaco, language]);

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
