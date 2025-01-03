import React, { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import {
  Box,
  Divider,
  Paper,
  Title,
  useMantineColorScheme,
  Text,
  Group,
  rem,
} from "@mantine/core";
import { MdClose } from "react-icons/md";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { CompletionFormatter } from "../../components/completion-formatter";
import useApi from "../../hooks/useApi";
import { File } from "../../utils/file-manager";
import { IconChevronRight } from "@tabler/icons-react";
const CodeCompletionEditor = ({
  selectedFile,
  setSelectedFile,
}: {
  selectedFile?: File;
  setSelectedFile: (file: File | undefined) => void;
}) => {
  const {
    language,
    editorRef,
    output,
    params,
    setParams,
    code,
    isEditorVisible,
    setIsEditorVisible,
  } = useTools();
  const monaco = useMonaco();
  const { data } = useApi("code-snippet", params);
  const { colorScheme } = useMantineColorScheme();
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
        freeInlineCompletions: () => {},
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
    setSelectedFile(undefined);
  }
  return (
    <Box style={{ height: "calc(100vh - 70px)" }}>
      <Box p={5}>
        {isEditorVisible && (
          <Box>
            <Box style={{ display: "flex" }}>
              <Box>
                <Text fw={700}>{selectedFile?.name} </Text>
              </Box>
              <MdClose
                size={22}
                onClick={handleClose}
                style={{
                  cursor: "pointer",
                  alignSelf: "center",
                  paddingLeft: "5px",
                }}
              />
            </Box>
            <Divider />
          </Box>
        )}

        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <Box
            style={{
              alignContent: "center",
              fontSize: "13px",
            }}
          >
            <Group display="flex" gap={2}>
              {breadcrumbItems.map((segment, index) => (
                <React.Fragment key={index}>
                  <Text size="sm">{segment}</Text>
                  {index < breadcrumbItems.length - 1 && (
                    <IconChevronRight
                      style={{ width: rem(18), height: rem(18) }}
                      stroke={1.5}
                    />
                  )}
                </React.Fragment>
              ))}
            </Group>
          </Box>
        )}
      </Box>
      <Paper
        style={{
          display: "flex",
          height: isEditorVisible
            ? "calc(96.5vh - 104px)"
            : "calc(100vh - 70px)",
          overflow: "auto",
        }}
      >
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
    </Box>
  );
};

export default CodeCompletionEditor;
