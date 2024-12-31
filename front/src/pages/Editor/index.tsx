import { Box, Container, Grid, Text } from "@mantine/core";
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
  const [selectedFile, setSelectedFile] = useState<File | undefined >(undefined);

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
    <Container fluid p={0}>
      <Grid gutter="md" style={{ height: "90vh"  }} pt={10}>
        <>
          <Grid.Col style={{ height: "90vh", backgroundColor:"#121212" ,display: "flex", flexDirection: "column", justifyContent: "space-between" }} span={0.5} p={10} pl={20}>
            <Box>
              <IconFiles style={{cursor:'pointer'}} onClick={() => setCollapsed(!collapsed)} stroke={2} size={30} />
            </Box>
            <Box mt="auto">
              <Upload collapsed={collapsed} />
            </Box>
          </Grid.Col>

          {!collapsed && (
            <Grid.Col span={2.5} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Box>
                <Text pb={10} pl={20} >EXPLORER</Text>
                <Box p={0} m={0}>
                  <FileTree rootDir={rootDir} selectedFile={selectedFile} onSelect={onSelect} />
                </Box>
              </Box>
              <Box mt="auto" pb={30}>

              </Box>
            </Grid.Col>

          )}
        </>
        <Grid.Col span={collapsed ? 11.5 : 9}>
          <CodeCompletionEditor selectedFile={selectedFile} setSelectedFile={setSelectedFile}/>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default EditorPage;
