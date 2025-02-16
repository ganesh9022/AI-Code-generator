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
import { RxCross1 } from "react-icons/rx";
import { useUser } from "@clerk/clerk-react";
import useLazyApi, { BackendEndpoints } from "../../hooks/useLazyApi";
import { useDetails } from "../../components/UserDetailsProviders";
import { Model } from "../../components/Layout/types";
const CodeCompletionEditor = ({
  selectedFile,
  setSelectedFile,
}: {
  selectedFile?: File;
  setSelectedFile: (file: File | undefined) => void;
}) => {
  const {
    state,
    updateState,
    editorRef,
    params,
    setParams,
  } = useTools();
  const monaco = useMonaco();
  const { selectedModel, output } = state;
  const useDebounceFlag = selectedModel != Model.MULTI_LAYER;
  const { data } = useApi("code-snippet", params, useDebounceFlag);
  const { colorScheme } = useMantineColorScheme();
  const { isLoaded, user, isSignedIn } = useUser();
  const { userData, setUserData } = useDetails();
  const isOpen = !!output;
  const { fetchData } = userData
    ? useLazyApi<{ userId: string; userName: string; email: string }>(
      BackendEndpoints.SaveUser
    )
    : { fetchData: () => {} };

  if (!isLoaded) {
    return null;
  }

  const closeOutputWindow = () => {
    updateState("output", "")
  };

  useEffect(() => {
    if (isSignedIn && userData) {
      const userId = user.id;
      const userName = user.username ?? "";
      const email = user.emailAddresses[0].emailAddress;
      if (userData.email !== email) {
        setUserData({ ...userData, userId, userName, email });
        fetchData({data: { userId, userName, email }});
      }
    }
  }, [isSignedIn, user, userData]);

  useEffect(() => {
    if (!monaco) return;

    const provider = monaco.languages.registerInlineCompletionsProvider(
      state.language,
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
  }, [monaco, state.language, data, selectedFile]);
  const handleClose = () => {
    updateState("isEditorVisible", false);
  };
  const selectedFileContent = selectedFile?.content;
  const breadcrumbItems = selectedFile?.path?.split("/");
  if (!state.isEditorVisible) {
    setSelectedFile(undefined);
  }
  return (
    <Box style={{ height: "calc(100vh - 70px)" }}>
      <Box p={5}>
        {state.isEditorVisible && (
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
          height: state.isEditorVisible
            ? "calc(96.5vh - 104px)"
            : "calc(100vh - 70px)",
          overflow: "auto",
        }}
      >
        <Paper w={state.output ? "50%" : "100%"}>
          <Editor
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            theme={colorScheme === "dark" ? "vs-dark" : "vs"}
            language={state.language}
            options={{
              autoClosingBrackets: "never",
              autoClosingQuotes: "never",
              formatOnType: true,
              formatOnPaste: true,
              trimAutoWhitespace: true,
            }}
            value={selectedFileContent || state.code}
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
        {isOpen && (
          <Paper
            w={"50%"}
            p={"10px"}
            style={{
              position: "relative",
              overflowY: "auto",
            }}
          >
            <RxCross1 onClick={closeOutputWindow} style={{
              cursor: "pointer", position: "absolute",
              top: "10px",
              right: "10px",
            }} />
            <Title order={4}>Output:</Title>
            <pre>{state.output || "No output yet"}</pre>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default CodeCompletionEditor;
