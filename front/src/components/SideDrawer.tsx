import React from "react";
import { Box, Button, Checkbox, Drawer, FileButton, FileInput, Text, rem } from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
import { useTools } from "./CodeCompletionToolsProviders";
import { Directory, File } from "../utils/file-manager";
import { v4 as gen_random_uuid } from "uuid";

interface SideDrawerProps {
  opened: boolean;
  close: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ opened, close }) => {
  const {
    file,
    setFile,
    showSelectedFileInEditor,
    setShowSelectedFileInEditor,
    setUploadFiles,
    setUploadFolders
  } = useTools();
  const icon = (
    <IconFileText style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
  );

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      const dirMap: { [path: string]: Directory } = {}
      const filesArray: File[] = [];

      for (const file of Array.from(files)) {
        const relativePath = file.webkitRelativePath;
        const pathParts = relativePath.split('/');

        const fileName = pathParts.pop() as string;
        let currentPath = '';
        let parentDir: Directory | undefined;
        pathParts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!dirMap[currentPath]) {
            const newDir: Directory = {
              id: gen_random_uuid(),
              name: part,
              parentId: parentDir?.id || '',
              type: 1,
              depth: index + 1,
              dirs: [],
              files: [],
            };

            dirMap[currentPath] = newDir;
            if (parentDir) {
              parentDir.dirs.push(newDir);
            }

            parentDir = newDir;
          } else {
            parentDir = dirMap[currentPath];
          }
        });
        const content = await file.text();

        const fileObject: File = {
          id: gen_random_uuid(),
          name: fileName,
          parentId: parentDir?.id || '',
          depth: pathParts.length + 1,
          content,
          type: 2,
        };

        parentDir?.files.push(fileObject);
        filesArray.push(fileObject);
      }
      const rootDirectory: Directory = {
        id: gen_random_uuid(),
        name: 'root',
        parentId: '',
        type: 1,
        depth: 0,
        dirs: Object.values(dirMap).filter((dir) => dir.depth === 1), // Only top-level directories
        files: [],
      };

      setUploadFolders(rootDirectory);

      console.log("Directory structure:", rootDirectory);
      console.log("All files:", filesArray);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={close}
      title="More options"
      position="right"
    >
      <Box style={{ display: 'flex', flexDirection: 'column', gap: rem(15) }}>
        <FileInput
          leftSection={icon}
          placeholder="Upload your context file"
          leftSectionPointerEvents="none"
          accept=".zip,.txt,.js,.ts,.jsx,.tsx,.json,.py,.java,.php"
          value={file}
          onChange={(files) => {
            if (files) {
              setFile(files);
            }
          }}
        />
        <Checkbox
          label="Show selected file in editor"
          checked={showSelectedFileInEditor}
          onChange={(event) => {
            setShowSelectedFileInEditor(event.currentTarget.checked);
          }}
        />
        <FileButton multiple onChange={(files) => setUploadFiles(files)}>
          {(props) => <Button radius='md' {...props}><Text>Upload Files</Text></Button>}
        </FileButton>
        <Button
          component="label"
          color="blue"
          radius="md"
          styles={{
            root: {
              cursor: 'pointer',
            },
          }}
        >
          <Text> Upload Folders</Text>
          <input
            type="file"
            name="file"
            multiple
            style={{ display: 'none' }}
            ref={(input) => {
              if (input) {
                input.setAttribute("webkitdirectory", "true");
                input.setAttribute("directory", "true");
              }
            }}
            onChange={handleFolderUpload}
          />
        </Button>
      </Box>
    </Drawer>
  );
};

export default SideDrawer;
