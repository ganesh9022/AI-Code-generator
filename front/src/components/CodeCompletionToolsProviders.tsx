import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import { Model, supported_language_versions } from "./Layout/Tools";
import * as monaco from "monaco-editor";
import axios from "axios";

interface ToolsProps {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  language: keyof typeof supported_language_versions;
  setLanguage: (language: keyof typeof supported_language_versions) => void;
  runCode: () => void;
  output: string;
  setOutput: (value: string) => void;
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  handleCodeChange: (currentCode: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  code: string;
  setCode: (code: string) => void;
  sideDrawerOpen: boolean;
  setSideDrawerOpen: (value: boolean) => void;
  showSelectedFileInEditor: boolean;
  setShowSelectedFileInEditor: (value: boolean) => void;
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
  file: null,
  setFile: () => {},
  code: "",
  setCode: () => {},
  sideDrawerOpen: false,
  setSideDrawerOpen: () => {},
  showSelectedFileInEditor: true,
  setShowSelectedFileInEditor: () => {},
});

export const ToolsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedModel, setSelectedModel] = useState<Model>(Model.Groq);
  const [language, setLanguage] =
    useState<keyof typeof supported_language_versions>("javascript");
  const [output, setOutput] = useState<string>("");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [showSelectedFileInEditor, setShowSelectedFileInEditor] =
    useState(true);
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

  useEffect(() => {
    if (file && showSelectedFileInEditor) {
      file?.text().then((text) => {
        setCode(text);
      });
    } else {
      setCode("");
    }
  }, [file, showSelectedFileInEditor]);

  return (
    <ToolsContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        language,
        setLanguage,
        output,
        setOutput,
        runCode,
        editorRef,
        handleCodeChange,
        file,
        setFile,
        code,
        setCode,
        sideDrawerOpen,
        setSideDrawerOpen,
        showSelectedFileInEditor,
        setShowSelectedFileInEditor,
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = (): ToolsProps => useContext(ToolsContext);
