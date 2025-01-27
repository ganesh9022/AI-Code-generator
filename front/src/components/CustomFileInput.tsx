import React, { useEffect, useState } from "react";
import {
  Button,
  Group,
  Paper,
  Text,
  Stack,
  Badge,
  useMantineColorScheme,
  Title,
  ScrollArea,
  ThemeIcon,
  Box,
  ActionIcon,
} from "@mantine/core";
import { IconFile, IconFiles, IconBrain, IconX } from "@tabler/icons-react";
import { useTools } from "./CodeCompletionToolsProviders";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "../hooks/useApi";
import { useNavigate } from "react-router-dom";

const CustomFileInput: React.FC = () => {
  const { state: { toggle, openFiles, openFolders }, updateState } = useTools();
  const [formData, setFormData] = useState<FormData | null>(null);
  const { error } = useApi("train-model", formData);
  const { colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!toggle) {
      navigate('/more-options');
    }
  }, [toggle, navigate]);

  if (!toggle) {
    return null;
  }

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

  const handleRemoveFile = () => {
    updateState("openFiles", null);
  };

  const handleRemoveFolder = () => {
    updateState("openFolders", null);
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
    newFormData.append("enable_groq", toggle.toString());
    setFormData(newFormData);
  };

  return (
    <Box 
      style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '20px'
      }}
    >
      <Paper
        shadow="md"
        radius="lg"
        p="xl"
        style={{ 
          width: '100%',
          maxWidth: 600,
          backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-6)" : "white"
        }}
      >
        <Stack gap="xl">
          <Stack gap="xs" align="center">
            <ThemeIcon size={60} radius={60} color="blue" variant="light" style={{ border: '2px solid var(--mantine-color-blue-5)' }}>
              <IconFiles size={30} />
            </ThemeIcon>
            <Title order={2}>GROQ RAG Model Training</Title>
            <Group gap="xs">
              <ThemeIcon size={24} radius={24} color="blue" variant="light">
                <IconBrain size={14} />
              </ThemeIcon>
              <Text size="sm" c="blue">Upload files to train GROQ RAG model</Text>
            </Group>
          </Stack>

          <Paper
            withBorder
            radius="md"
            p="lg"
            style={{
              backgroundColor: colorScheme === "dark" ? "var(--mantine-color-dark-7)" : "var(--mantine-color-gray-0)",
            }}
          >
            <Stack gap="md">
              <Group grow>
                <Button
                  variant="light"
                  leftSection={<IconFile size={20} />}
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  Select File
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconFiles size={20} />}
                  onClick={() => document.getElementById("folderInput")?.click()}
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

              {(openFiles || openFolders) && (
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500}>Selected Files</Text>
                    <Badge size="lg" variant="light">
                      {openFolders ? Array.from(openFolders).length + (openFiles ? 1 : 0) : (openFiles ? 1 : 0)} files
                    </Badge>
                  </Group>
                  <ScrollArea.Autosize mah={200}>
                    <Stack gap="xs">
                      {openFiles && (
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <ThemeIcon color="blue" size={24} variant="light">
                              <IconFile size={14} />
                            </ThemeIcon>
                            <Text size="sm" truncate>{openFiles.name}</Text>
                          </Group>
                          <ActionIcon 
                            variant="subtle" 
                            color="red" 
                            onClick={handleRemoveFile}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Group>
                      )}
                      {openFolders && Array.from(openFolders).map((file, index) => (
                        <Group key={index} justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <ThemeIcon color="blue" size={24} variant="light">
                              <IconFile size={14} />
                            </ThemeIcon>
                            <Text size="sm" truncate>{file.name}</Text>
                          </Group>
                          <ActionIcon 
                            variant="subtle" 
                            color="red" 
                            onClick={handleRemoveFolder}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Group>
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                </Stack>
              )}
            </Stack>
          </Paper>

          <Stack gap="md">
            <Button
              onClick={submitTrainingData}
              size="md"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
              leftSection={<IconBrain size={20} />}
              disabled={!openFiles && !openFolders}
            >
              Train GROQ RAG Model
            </Button>
            <Button 
              variant="subtle" 
              size="md" 
              onClick={() => navigate('/more-options')}
              color="gray"
            >
              Go Back
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CustomFileInput;
