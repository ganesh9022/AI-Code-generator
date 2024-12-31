import React, { useState } from "react";
import {
  Button,
  Group,
  List,
  Center,
  Paper,
  rem,
  Text,
  Stack,
  Badge,
  Switch,
} from "@mantine/core";
import axios from "axios";
import { IconFile } from "@tabler/icons-react";

const CustomFileInput: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState<FileList | null>(null);
  const [contextualResponse, setContextualResponse] = useState<boolean>(true);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFolder(event.target.files);
    }
  };

  const handleTrainModel = async () => {
    const formData = new FormData();
    if (file) {
      formData.append("files", file);
    }
    if (folder) {
      Array.from(folder).forEach((file) => {
        formData.append("files", file);
      });
    }

    try {
      await axios.post("/train-model", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error training model:", error);
    }
  };

  return (
    <div>
      <Center mt={20} style={{ flexDirection: "column" }}>
        <Stack align="flex-start" gap={0}>
          <Group>
            <Text size="xl">Contextual responses</Text>
            <Badge color="gray" size="sm">
              BETA
            </Badge>
            <Switch
              checked={contextualResponse}
              onChange={(event) =>
                setContextualResponse(event.currentTarget.checked)
              }
              size="md"
              style={{ marginLeft: "auto" }}
            />
          </Group>
          <Text size="xs" color="dimmed">
            This feature allows you to upload files and folders for model
            training.
          </Text>
        </Stack>
        <Group mt={20}>
          <Button
            variant="outline"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            Open file
          </Button>
          <Button
            variant="filled"
            onClick={() => document.getElementById("folderInput")?.click()}
          >
            Open folder
          </Button>
        </Group>
      </Center>
      <input
        type="file"
        id="fileInput"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        id="folderInput"
        style={{ display: "none" }}
        ref={(input) => {
          if (input) {
            input.setAttribute("webkitdirectory", "true");
            input.setAttribute("mozdirectory", "true");
          }
        }}
        onChange={handleFolderChange}
      />
      {file || (folder && folder.length > 0) ? (
        <>
          <Paper shadow="xs" withBorder style={{ marginTop: 20, padding: 10 }}>
            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <IconFile
                  style={{ width: rem(18), height: rem(18) }}
                  stroke={1.5}
                />
              }
            >
              {file && (
                <List.Item>{file.webkitRelativePath || file.name}</List.Item>
              )}
              {folder &&
                Array.from(folder).map((file, index) => (
                  <List.Item key={index}>
                    {file.webkitRelativePath || file.name}
                  </List.Item>
                ))}
            </List>
          </Paper>
          <Center mt={20}>
            <Button variant="gradient" onClick={handleTrainModel}>
              Train Model
            </Button>
          </Center>
        </>
      ) : null}
    </div>
  );
};

export default CustomFileInput;
