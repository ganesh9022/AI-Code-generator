import React, { useEffect, useState } from "react";
import {
  Button,
  Group,
  List,
  Paper,
  Text,
  Stack,
  Badge,
  Switch,
  useMantineColorScheme,
  Title,
  ScrollArea,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { IconFile, IconFiles, IconBrain } from "@tabler/icons-react";
import { useTools } from "./CodeCompletionToolsProviders";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "../hooks/useApi";
import { useNavigate } from "react-router-dom";

const CustomFileInput: React.FC = () => {
  const {
    state: { toggle, openFiles, openFolders },
    updateState,
    setParams,
    params,
  } = useTools();
  const [formData, setFormData] = useState<FormData | null>(null);
  const { error } = useApi("train-model", formData);
  const { colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (formData) {
      toast.success("Model trained successfully!");
    } else if (error) {
      toast.error("Failed to train model.");
    }
  }, [formData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      updateState("openFiles", event.target.files[0]);
    }
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      updateState("openFolders", event.target.files);
    }
  };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newToggleValue = event.currentTarget.checked;
    updateState("toggle", newToggleValue);

    setParams({
      ...params,
      toggle: newToggleValue,
    });
  };

  const submitTrainingData = async () => {
    const newFormData = new FormData();

    if (openFiles) {
      newFormData.append("files", openFiles);
    }
    if (openFolders) {
      Array.from(openFolders).forEach((file) => {
        newFormData.append("files", file);
      });
    }
    setFormData(newFormData);
  };

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        minHeight: "calc(100vh - 60px)",
        padding: "20px",
      }}
    >
      <Paper
        shadow="md"
        radius="lg"
        p="xl"
        mt={80}
        style={{
          width: "100%",
          maxWidth: 800,
          backgroundColor:
            colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "white",
        }}
      >
        <Stack gap="xl">
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Stack gap={0}>
                <Title order={3}>File Upload Settings</Title>
                <Text size="sm" c="dimmed">
                  Configure how you want to train the model
                </Text>
              </Stack>
              <Switch
                checked={toggle}
                onChange={handleToggleChange}
                size="md"
                label="Enable file upload"
                labelPosition="left"
              />
            </Group>
          </Stack>

          <Paper
            withBorder
            radius="md"
            p="lg"
            style={{
              backgroundColor:
                colorScheme === "dark"
                  ? "var(--mantine-color-dark-7)"
                  : "var(--mantine-color-gray-0)",
              opacity: toggle ? 1 : 0.5,
              transition: "opacity 0.2s ease",
            }}
          >
            <Stack gap="md">
              <Group grow>
                <Button
                  variant="light"
                  leftSection={<IconFile size={20} />}
                  onClick={() => document.getElementById("fileInput")?.click()}
                  disabled={!toggle}
                >
                  Select File
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconFiles size={20} />}
                  onClick={() =>
                    document.getElementById("folderInput")?.click()
                  }
                  disabled={!toggle}
                >
                  Select Folder
                </Button>
              </Group>

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
            </Stack>
          </Paper>

          {(openFiles || (openFolders && openFolders.length > 0)) && (
            <Paper
              withBorder
              radius="md"
              p="lg"
              style={{
                backgroundColor:
                  colorScheme === "dark"
                    ? "var(--mantine-color-dark-7)"
                    : "var(--mantine-color-gray-0)",
              }}
            >
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={500}>Selected Files</Text>
                  <Badge size="lg" variant="light">
                    {openFolders
                      ? Array.from(openFolders).length + (openFiles ? 1 : 0)
                      : openFiles
                        ? 1
                        : 0}{" "}
                    files
                  </Badge>
                </Group>
                <ScrollArea.Autosize mah={200}>
                  <List
                    spacing="xs"
                    size="sm"
                    center
                    icon={
                      <ThemeIcon color="blue" size={24} variant="light">
                        <IconFile size={14} />
                      </ThemeIcon>
                    }
                  >
                    {openFiles && (
                      <List.Item>
                        <Text size="sm">
                          {openFiles.webkitRelativePath || openFiles.name}
                        </Text>
                      </List.Item>
                    )}
                    {openFolders &&
                      Array.from(openFolders).map((file, index) => (
                        <List.Item key={index}>
                          <Text size="sm">
                            {file.webkitRelativePath || file.name}
                          </Text>
                        </List.Item>
                      ))}
                  </List>
                </ScrollArea.Autosize>
              </Stack>
            </Paper>
          )}

          {(openFiles || (openFolders && openFolders.length > 0)) && (
            <Button
              onClick={submitTrainingData}
              size="md"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
              leftSection={<IconBrain size={20} />}
            >
              Train Model
            </Button>
          )}
          <Button
            variant="subtle"
            fullWidth
            size="md"
            onClick={() => navigate("/more-options")}
            color="gray"
          >
            Go Back
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CustomFileInput;
