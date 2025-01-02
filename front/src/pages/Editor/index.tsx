import { Box, Container, Grid, Stack, Text } from "@mantine/core";
import CodeCompletionEditor from "./codeCompletion";
import { FileTree } from "../../components/file-tree";
import { Directory, Type, File } from "../../utils/file-manager";
import { useState, useEffect } from "react";
import { v4 as gen_random_uuid } from "uuid";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { IconFiles } from "@tabler/icons-react";
import { Upload } from "./upload";


const EditorPage = () => {
  const { uploadFiles, uploadFolders } = useTools();

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

        setRootDir({
          ...dummyDir,
          files,
        });
      }
    };

    updateDir();
  }, [uploadFiles, uploadFolders]);

  const onSelect = (file: File) => setSelectedFile(file);
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Container fluid p={0} m={0} style={{overflow:'hidden'}}>
      <Grid gutter="md" h="calc(100vh - 64px)" m={0} p={0} pt={10} >
        <>
          <Grid.Col m={0} style={{ height: "calc(100vh - 64px)", alignContent: 'center', alignItems: 'center', backgroundColor: "#121212", display: "flex", flexDirection: "column", justifyContent: "space-between" }} span={0.7} p={10} pl={20}>
            <Box>
              <IconFiles style={{ cursor: 'pointer' }} color="white" onClick={() => setCollapsed(!collapsed)} stroke={2} size={30} />
            </Box>
            <Box mt="auto">
              <Upload collapsed={collapsed} />
            </Box>
          </Grid.Col>

          {!collapsed && (
            <Grid.Col p={0} span={2.3} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box>
                <Text p={12} >EXPLORER</Text>
                <Box mr={10} style={{ height:"calc(90vh - 100px)" , maxWidth: "100%", overflowY: 'auto', overflowX: 'auto' }}>
                  <FileTree rootDir={rootDir} selectedFile={selectedFile} onSelect={onSelect} />
                </Box>
              </Box>
              {!collapsed && (
                <Stack pb={15} gap={5} m={0} pl={20} style={{position: 'sticky', bottom: 0}}>
                  <Text c="var(--mantine-color-text)">Open Files</Text>
                  <Text c="var(--mantine-color-text)">Open Folders</Text>
                </Stack>
              )}

            </Grid.Col>

          )}
        </>
        <Grid.Col p={0} span={collapsed ? 11.3 : 9}>
          <CodeCompletionEditor selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default EditorPage;
