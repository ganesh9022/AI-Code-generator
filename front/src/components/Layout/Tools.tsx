import React from "react";
import { Flex, Button, Select } from "@mantine/core";

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

interface ToolsProps {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  language: keyof typeof supported_language_versions;
  setLanguage: (language: keyof typeof supported_language_versions) => void;
  runCode: () => void;
}

const Tools: React.FC<ToolsProps> = ({
  selectedModel,
  setSelectedModel,
  language,
  setLanguage,
  runCode,
}) => {
  return (
    <Flex justify="center" align="flex-end" gap="md" m={10}>
      <Button variant="filled" onClick={runCode}>
        Run Code
      </Button>
      <Select
        data={[
          { value: "javascript", label: "JavaScript" },
          { value: "typescript", label: "TypeScript" },
          { value: "python", label: "Python" },
          { value: "php", label: "PHP" },
          { value: "java", label: "Java" },
        ]}
        value={language}
        onChange={(e) =>
          setLanguage(e as keyof typeof supported_language_versions)
        }
      />
      <Select
        data={modelOptions}
        value={selectedModel}
        onChange={(e) => setSelectedModel(e as Model)}
      />
    </Flex>
  );
};

export default Tools;
