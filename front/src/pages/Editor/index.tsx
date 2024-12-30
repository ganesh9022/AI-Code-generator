import { Container, Grid } from "@mantine/core";
import CodeCompletionEditor from "./codeCompletion";
import { FileTree } from "../../components/file-tree";
import { Directory, Type, File } from "../../utils/file-manager";
import { useState, useEffect } from "react";
import { v4 as gen_random_uuid } from "uuid";
import { useTools } from "../../components/CodeCompletionToolsProviders";


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

  return (
    <Container fluid p={0}>
      <Grid gutter="md" style={{ height: "100vh" }}>
        <Grid.Col span={3} p={10} pl={20}>
          <FileTree rootDir={rootDir} selectedFile={selectedFile} onSelect={onSelect} />
        </Grid.Col>
        <Grid.Col span={9}>
          <CodeCompletionEditor selectedFile={selectedFile} />
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default EditorPage;
