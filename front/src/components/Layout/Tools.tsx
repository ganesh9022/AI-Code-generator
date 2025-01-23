import React, { useState, useEffect } from "react";
import { Flex, Button, Select, rem } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";
import { useTools } from "../CodeCompletionToolsProviders";
import { Model, PageTitle, supported_language_versions } from "./types";

const modelOptions = [
  { value: Model.Ollama, label: "Ollama (granite-code:3b-instruct-128k-q2_K)" },
  { value: Model.Groq, label: "Groq (llama3-8b-8192)" },
  { value: Model.MULTI_LAYER, label: "Multi-Layer ML model" },
];

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
  pageTitle: PageTitle;
}

const Tools: React.FC<ToolsProps> = ({
  selectedModel,
  setSelectedModel,
  language,
  setLanguage,
  runCode,
  pageTitle,
}) => {
  const icon = (
    <IconPlayerPlay style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
  );
  const { setParams, params } = useTools();
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  useEffect(() => {
    if (pageTitle === PageTitle.CHAT && selectedModel === Model.MULTI_LAYER) {
      setSelectedModel(Model.Groq);
      setParams({
        ...params,
        model: Model.Groq,
      });
    }
  }, [pageTitle, selectedModel, setSelectedModel, setParams]);

  const availableModels =
    pageTitle === PageTitle.CHAT
      ? modelOptions.filter(({ value }) => value !== Model.MULTI_LAYER)
      : modelOptions;

  return (
    <Flex justify="center" align="flex-end" gap="md" m={10}>
      {pageTitle === PageTitle.EDITOR && (
        <>
          <Button leftSection={icon} variant="filled" onClick={runCode}>
            Run Code
          </Button>
          <Select
            allowDeselect={false}
            data={options}
            onClick={() => setLanguageDropdownOpen(true)}
            value={language || "javascript"}
            onChange={(e) => {
              const newLanguage = e as keyof typeof supported_language_versions;
              setLanguage(newLanguage);
              setParams({
                ...params,
                language: newLanguage,
              });
              setLanguageDropdownOpen(false);
            }}
            onBlur={() => setLanguageDropdownOpen(false)}
            dropdownOpened={languageDropdownOpen}
          />
        </>
      )}
      <Select
        data={availableModels}
        allowDeselect={false}
        onClick={() => setModelDropdownOpen(true)}
        value={selectedModel || Model.Groq}
        onChange={(e) => {
          const newModel = e as Model;
          setSelectedModel(newModel);
          setParams({
            ...params,
            model: newModel,
          });
          setModelDropdownOpen(false);
        }}
        onBlur={() => setModelDropdownOpen(false)}
        dropdownOpened={modelDropdownOpen}
      />
    </Flex>
  );
};

export default Tools;
