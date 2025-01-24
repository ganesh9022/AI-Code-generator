import { Box, Container, Grid, Text, Tooltip, useMantineColorScheme } from "@mantine/core";
import CodeCompletionEditor from "./codeCompletion";
import { FileTree } from "../../components/file-tree";
import { Directory, Type, File } from "../../utils/file-manager";
import { useState, useEffect } from "react";
import { v4 as gen_random_uuid } from "uuid";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { IconFiles } from "@tabler/icons-react";
import { Upload } from "./upload";
import { LocalStorageKeys } from "../../components/CodeCompletionToolsProviders";

const EditorPage = () => {
  const { state: { uploadFolders, uploadFiles } } = useTools();
  const { colorScheme } = useMantineColorScheme();
  const dummyDir: Directory = {
    id: "1",
    name: "Dummy",
    type: Type.DUMMY,
    parentId: undefined,
    depth: 1,
    dirs: [],
    files: [],
  };

  const [rootDir, setRootDir] = useState<Directory>(dummyDir);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    const updateDir = async () => {
      if (uploadFolders) {
        localStorage.removeItem(LocalStorageKeys.UploadFiles);
        setRootDir(uploadFolders);
      } else if (Array.isArray(uploadFiles) && uploadFiles.length > 0) {
        const files: File[] = await Promise.all(
          uploadFiles.map(async (uploadedFile) => ({
            content: await uploadedFile.text(),
            id: gen_random_uuid(),
            parentId: "1",
            depth: 0,
            type: Type.FILE,
            name: uploadedFile.name || "Untitled",
          }))
        );
        localStorage.setItem(LocalStorageKeys.UploadFiles, JSON.stringify(files));

        setRootDir({
          ...dummyDir,
          files,
        });
      }
    };

    updateDir();
  }, [uploadFiles, uploadFolders]);

  useEffect(() => {
    const hasFiles = rootDir.files.length > 0 || rootDir.dirs.length > 0;
    setCollapsed(!hasFiles)
  }, [rootDir]);

  const onSelect = (file: File) => setSelectedFile(file);
  const [collapsed, setCollapsed] = useState(true)
  const hasFiles = rootDir.files.length > 0|| rootDir.dirs.length > 0;
  useEffect(() => {
      const savedUploadFiles = localStorage.getItem(LocalStorageKeys.UploadFiles);
      if (savedUploadFiles) {
        const files: File[] = JSON.parse(savedUploadFiles).map((fileData: any) => ({
          ...fileData, 
          text: async () => fileData.content,
        }));
        setRootDir({
          ...dummyDir,
          files,
        });

      };
  }, [])
 
  return (
    <Container fluid p={0} m={0} style={{ overflow: "hidden" }}>
      <Grid gutter="md" h="calc(100vh - 64px)" m={0} p={0} pt={10}>
        <>
          <Grid.Col
            m={0} 
            bg={colorScheme === "dark" ? "#121212" : "#4D7FA0"}
            style={{
              height: "calc(100vh - 64px)",
              alignContent: "center",
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            span={0.7}
            p={10}
            pl={20}
          >
            <Tooltip label={collapsed ? "Show files" : "Hide files"}>
              <Box>
                <IconFiles
                  style={{ cursor: "pointer" }}
                  color="white"
                  onClick={() => setCollapsed(!collapsed)}
                  stroke={2}
                  size={30}
                />
              </Box>
            </Tooltip>

            <Box mt="auto">
              <Upload />
            </Box>
          </Grid.Col>

          {!collapsed && (
            <Grid.Col
              p={0}
              span={2.3}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Text p={12}>EXPLORER</Text>
                <Box
                  mr={10}
                  style={{
                    height: "calc(100vh - 100px)",
                    maxWidth: "100%",
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  {hasFiles ?
                  <FileTree
                    rootDir={rootDir}
                    selectedFile={selectedFile}
                    onSelect={onSelect}
                  />:
                  <Text pl={20} p={10}>No files / folders to display</Text>}
                </Box>
              </Box>
            </Grid.Col>
          )}
        </>
        <Grid.Col p={0} span={collapsed ? 11.3 : 9}>
          <CodeCompletionEditor
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default EditorPage;
