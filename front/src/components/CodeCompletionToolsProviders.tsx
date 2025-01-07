import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
} from "react";
import { Model, supported_language_versions } from "./Layout/Tools";
import * as monaco from "monaco-editor";
import axios from "axios";
import { Directory } from "../utils/file-manager";

export interface Params {
  prefix: string;
  currentLine: string;
  suffix: string;
  language: keyof typeof supported_language_versions;
  model: Model;
  toggle: boolean;
}
interface ToolsProps {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  toggle: boolean;
  setToggle: (toggle: boolean) => void;
  language: keyof typeof supported_language_versions;
  setLanguage: (language: keyof typeof supported_language_versions) => void;
  runCode: () => void;
  output: string;
  setOutput: (value: string) => void;
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  handleCodeChange: (currentCode: string) => void;
  code: string;
  setCode: (code: string) => void;
  sideDrawerOpen: boolean;
  setSideDrawerOpen: (value: boolean) => void;
  uploadFiles: File[] | null;
  setUploadFiles: (file: File[] | null) => void;
  setUploadFolders: (directory: Directory | null) => void;
  uploadFolders: Directory | null;
  params: Params;
  setParams: (params: Params) => void;
  isEditorVisible: boolean;
  setIsEditorVisible: (value: boolean) => void;
}

const ToolsContext = createContext<ToolsProps>({
  selectedModel: Model.ML,
  setSelectedModel: () => {},
  language: "javascript",
  setLanguage: () => {},
  runCode: () => {},
  output: "",
  setOutput: () => {},
  editorRef: { current: null },
  handleCodeChange: () => {},
  code: "",
  setCode: () => {},
  sideDrawerOpen: false,
  setSideDrawerOpen: () => {},
  setUploadFiles: () => {},
  uploadFiles: null,
  setUploadFolders: () => {},
  uploadFolders: null,
  toggle: false,
  setToggle: () => {},
  params: {
    prefix: "",
    currentLine: "",
    suffix: "",
    language: "javascript",
    model: Model.ML,
    toggle: false,
  },
  setParams: () => {},
  isEditorVisible: true,
  setIsEditorVisible: () => {},
});

export const ToolsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedModel, setSelectedModel] = useState<Model>(Model.Groq);
  const [language, setLanguage] = useState<keyof typeof supported_language_versions>("javascript");
  const [output, setOutput] = useState<string>("");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState("");
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[] | null>(null);
  const [uploadFolders, setUploadFolders] = useState<Directory | null>(null);
  const [toggle, setToggle] = useState(false);
  const [params, setParams] = useState({
    prefix: "",
    currentLine: "",
    suffix: "",
    language: language,
    model: selectedModel,
    toggle: false,
  });
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const API = axios.create({
    baseURL: "https://emkc.org/api/v2/piston",
  });

  const handleCodeChange = async (currentCode: string) => {
    const trimmedCode = currentCode.trim();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/find-function/`,
        {
          function_name: trimmedCode,
        }
      );
      const { function_name, code } = response.data;
      const message = code ? `Function: ${function_name}\n\n${code}` : "";
      editorRef.current?.setValue(message);
    } catch (error) {
      editorRef.current?.setValue(currentCode + "\nError fetching completion.");
    }
  };

  const runCode = async () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = function (...args) {
        logs.push(args.join(" "));
        originalConsoleLog.apply(console, args);
      };

      try {
        const lang: keyof typeof supported_language_versions = language;
        const version = supported_language_versions[lang];
        if (!lang || !version) {
          setOutput("Error: Unsupported language or missing version.");
          return;
        }

        const response = await API.post("/execute", {
          language: lang,
          version,
          files: [
            {
              content: code,
            },
          ],
        });

        setOutput(response.data.run?.output);
      } catch (error) {
        setOutput("Error: " + error);
      }
    }
  };
  return (
    <ToolsContext.Provider
      value={{
        toggle,
        setToggle,
        selectedModel,
        setSelectedModel,
        language,
        setLanguage,
        output,
        setOutput,
        runCode,
        editorRef,
        handleCodeChange,
        code,
        setCode,
        sideDrawerOpen,
        setSideDrawerOpen,
        setUploadFiles,
        uploadFiles,
        setUploadFolders,
        uploadFolders,
        params,
        setParams,
        isEditorVisible,
        setIsEditorVisible,
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = (): ToolsProps => useContext(ToolsContext);
