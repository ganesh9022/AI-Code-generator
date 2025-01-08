import { Box, Button, FileButton,Tooltip } from "@mantine/core";
import { useTools } from "../../components/CodeCompletionToolsProviders";
import { v4 as gen_random_uuid } from "uuid";
import { Directory, File } from "../../utils/file-manager";
import { IconFolderUp, IconFileUpload } from '@tabler/icons-react';
export const Upload = () => {
    const {
        setUploadFiles,
        setUploadFolders
    } = useTools();
    const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        
    if (files && files.length > 0) {
      const dirMap: { [path: string]: Directory } = {};
      const filesArray: File[] = [];

      for (const file of Array.from(files)) {
        const relativePath = file.webkitRelativePath;
        const pathParts = relativePath.split("/");

        const fileName = pathParts.pop() as string;
        let currentPath = "";
        let parentDir: Directory | undefined;
        pathParts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!dirMap[currentPath]) {
            const newDir: Directory = {
              id: gen_random_uuid(),
              name: part,
              parentId: parentDir?.id || "",
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
          parentId: parentDir?.id || "",
          depth: pathParts.length + 1,
          content,
          path: relativePath,
          type: 2,
        };

        parentDir?.files.push(fileObject);
        filesArray.push(fileObject);
      }
      const rootDirectory: Directory = {
        id: gen_random_uuid(),
        name: "root",
        parentId: "",
        type: 1,
        depth: 0,
        dirs: Object.values(dirMap).filter((dir) => dir.depth === 1),
        files: [],
      };
      
      setUploadFolders(rootDirectory);
    }
  };
  return (
    <Box mt={"auto"}>
      <Tooltip
        label="Open files"
        position="top"
        styles={{
          tooltip: {
            fontSize: "16px",
            padding: "10px",
          },
        }}
      >
        <div>
          <FileButton multiple onChange={(files) => {
            setUploadFolders(null);
            setUploadFiles(files)}}>
            {(props) => (
              <Button bg="none" radius="md" {...props} mb={15}>
                <Box display="flex">
                  <IconFileUpload stroke={2} />
                </Box>
              </Button>
            )}
          </FileButton>
        </div>
      </Tooltip>
      <Tooltip
        label="Open folder"
        position="top"
        styles={{
          tooltip: {
            fontSize: "16px",
            padding: "10px",
          },
        }}
      >
        <Button
          component="label"
          bg="none"
          styles={{
            root: {
              cursor: "pointer",
            },
          }}
        >
          <Box display="flex">
            <IconFolderUp stroke={2} />
          </Box>
          <input
            type="file"
            name="file"
            multiple
            style={{ display: "none" }}
            ref={(input) => {
              if (input) {
                input.setAttribute("webkitdirectory", "true");
                input.setAttribute("directory", "true");
              }
            }}
            onChange={(event) => {
              setUploadFiles(null);
              handleFolderUpload(event);
            }}
          />
        </Button>
      </Tooltip>
    </Box>
  );
};
