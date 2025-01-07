import React from "react";
import { Flex, Button, Select, rem } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";
import { useTools, Params } from "../CodeCompletionToolsProviders";

export enum Model {
  Ollama = "ollama",
  Groq = "groq",
  ML = "ml",
}

const modelOptions = [
  { value: Model.Ollama, label: "Ollama (codellama:7b-code)" },
  { value: Model.Groq, label: "Groq (llama3-8b-8192)" },
  { value: Model.ML, label: "ML model" },
];

export const supported_language_versions = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  php: "8.2.3",
};

const options = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "php", label: "PHP" },
  { value: "java", label: "Java" },
];

interface ToolsProps {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  language: keyof typeof supported_language_versions;
  setLanguage: (language: keyof typeof supported_language_versions) => void;
  runCode: () => void;
  pageTitle: string
}

const Tools: React.FC<ToolsProps> = ({
  selectedModel,
  setSelectedModel,
  language,
  setLanguage,
  runCode,
  pageTitle
}) => {
  const icon = (
    <IconPlayerPlay style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
  );
  const { setParams } = useTools();
  return (
    <Flex justify="center" align="flex-end" gap="md" m={10}>
      <Button leftSection={icon} variant="filled" onClick={runCode}>
        Run Code
      </Button>
      {pageTitle !== 'Chat' &&
        <Select
          data={options}
          value={language}
          onChange={(e) => {
            const newLanguage = e as keyof typeof supported_language_versions;
            setLanguage(newLanguage);
            setParams((prevParams: Params) => ({
              ...prevParams,
              language: newLanguage,
            }));
          }}
          searchable
        />}
      <Select
        data={modelOptions}
        value={selectedModel}
        onChange={(e) => {
          const newModel = e as Model;
          setSelectedModel(newModel);
          setParams((prevParams: Params) => ({
            ...prevParams,
            model: newModel,
          }));
        }}
        searchable
      />
    </Flex>
  );
};

export default Tools;
