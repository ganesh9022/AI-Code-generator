import React, { useEffect, useState } from "react";
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
import { useTools, Params } from "./CodeCompletionToolsProviders";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "../hooks/useApi";


const TrainModelButton = ({ onTrainModel, filesSelected }) => {
  return filesSelected ? (
    <Center mt={20}>
      <Button variant="gradient" onClick={onTrainModel}>
        Train Model
      </Button>
    </Center>
  ) : null;
};

const CustomFileInput: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState<FileList | null>(null);
  const [shouldTrainModel, setShouldTrainModel] = useState<boolean>(false);

  const { toggle, setToggle, setParams } = useTools();
  const [formData, setFormData] = useState<FormData | null>(null);
  const { data, error } = useApi(
    "train-model",
    formData,
    shouldTrainModel
  );

  useEffect(() => {
    if (data) {
      toast.success("Model trained successfully!");
      setShouldTrainModel(false);
    } else if (error) {
      toast.error("Failed to train model.");
      setShouldTrainModel(false);
    }
  }, [data, error]);

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

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToggleValue = event.currentTarget.checked;
    setToggle(newToggleValue);

    setParams((prevParams: Params) => ({
      ...prevParams,
      toggle: newToggleValue,
    }));
  };

  const submitTrainingData =
    async () => {
      const newFormData = new FormData();

      if (file) {
        newFormData.append("files", file);
      }
      if (folder) {
        Array.from(folder).forEach((file) => {
          newFormData.append("files", file);
        });
      }
      setFormData(newFormData);
      setShouldTrainModel(true);

    }

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
              checked={toggle}
              onChange={handleToggleChange}
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
            disabled={!toggle}
          >
            Open file
          </Button>
          <Button
            variant="filled"
            onClick={() => document.getElementById("folderInput")?.click()}
            disabled={!toggle}
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
        </>
      ) : null}
      <TrainModelButton
        onTrainModel={submitTrainingData}
        filesSelected={file || (folder && folder.length > 0)}
      />
    </div>
  );
};

export default CustomFileInput;
