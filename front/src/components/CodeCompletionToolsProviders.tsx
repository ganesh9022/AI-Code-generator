/* eslint-disable react-refresh/only-export-components */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { Model, supported_language_versions } from "./Layout/types";
import * as monaco from "monaco-editor";
import axios from "axios";
import { Directory } from "../utils/file-manager";
import { useUser } from "@clerk/clerk-react";
  
export enum LocalStorageKeys {
  ToolsState = "toolsState",
  OpenFiles = "openFiles",
  OpenFolders = "openFolders",
  UploadFiles = "uploadFiles",
}

export interface ToolsState {
  selectedModel: Model;
  language: keyof typeof supported_language_versions;
  output: string;
  code: string;
  sideDrawerOpen: boolean;
  uploadFiles: File[] | null;
  uploadFolders: Directory | null;
  toggle: boolean;
  isEditorVisible: boolean;
  openFiles: File | null;
  openFolders: FileList | null;
}

export interface Params {
  prefix: string;
  currentLine: string;
  suffix: string;
  language: keyof typeof supported_language_versions;
  model: Model;
  toggle: boolean;
}

interface ToolsProps {
  state: ToolsState;
  updateState: <K extends keyof ToolsState>(key: K, value: ToolsState[K]) => void;
  runCode: () => void;
  handleCodeChange: (currentCode: string) => void;
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  params: Params;
  setParams: (params: Params) => void;
}

const ToolsContext = createContext<ToolsProps>({
  state: {
    selectedModel: Model.Groq,
    language: "javascript",
    output: "",
    code: "",
    sideDrawerOpen: false,
    uploadFiles: null,
    uploadFolders: null,
    toggle: false,
    isEditorVisible: true,
    openFiles: null,
    openFolders: null,
  },
  params: {
    prefix: "",
    currentLine: "",
    suffix: "",
    language: "javascript",
    model: Model.Groq,
    toggle: false,
  },
  setParams: () => {},
  updateState: () => {},
  runCode: () => {},
  handleCodeChange: () => {},
  editorRef: { current: null },
});

export const ToolsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const initialState = useMemo<ToolsState>(() => {
    const savedState = localStorage.getItem(LocalStorageKeys.ToolsState);
    const savedOpenFiles = localStorage.getItem(LocalStorageKeys.OpenFiles);
    const savedOpenFolders = localStorage.getItem(LocalStorageKeys.OpenFolders);
    return {
      ...(savedState
        ? JSON.parse(savedState)
        : {
            selectedModel: Model.Groq,
            language: "javascript",
            output: "",
            code: "",
            sideDrawerOpen: false,
            uploadFiles: null,
            uploadFolders: null,
            toggle: false,
            isEditorVisible: false,
          }),
      openFiles: savedOpenFiles ? JSON.parse(savedOpenFiles) : null,
      openFolders: savedOpenFolders ? JSON.parse(savedOpenFolders) : null,
    };
  }, []);
  const [state, setState] = useState<ToolsState>(initialState);
  const { selectedModel, language, openFiles, openFolders } = state;

  const initialParams = useMemo<Params>(() => ({
    prefix: "",
    currentLine: "",
    suffix: "",
    language: language,
    model: selectedModel,
    toggle: false,
  }), [language, selectedModel]);
  const [params, setParams] = useState<Params>(initialParams);

  const API = axios.create({
    baseURL: "https://emkc.org/api/v2/piston",
  });

  useEffect(() => {
    if (openFiles) {
      localStorage.setItem(LocalStorageKeys.OpenFiles,JSON.stringify({
          name: openFiles.name,
          size: openFiles.size
        })
      );
    }

    if (openFolders) {
      const folderFiles = Array.from(openFolders).map((file) => ({
        name: file.webkitRelativePath || file.name,
        size: file.size
      }));
      localStorage.setItem(LocalStorageKeys.OpenFolders, JSON.stringify(folderFiles));
    }

    localStorage.setItem(LocalStorageKeys.ToolsState, JSON.stringify(state));
  }, [state]);

  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
  
    if (user === null) {
      Object.values(LocalStorageKeys).forEach((key) => localStorage.removeItem(key));
    }
  }, [user, isLoaded]);

  const updateState = <K extends keyof ToolsState>(
    key: K,
    value: ToolsState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));

  };

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
      editorRef.current?.setValue(currentCode + "\nError fetching completion."+error);
    }
  };

  const runCode = async () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      try {
        const lang: keyof typeof supported_language_versions = state.language;
        const version = supported_language_versions[lang];
        if (!lang || !version) {
          updateState("output", "Error: Unsupported language or missing version.");
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

        updateState("output", response.data.run?.output || "");
      } catch (error) {
        updateState("output", "Error: " + error);
      }
    }
  };
  return (
    <ToolsContext.Provider
      value={{
        state,
        updateState,
        runCode,
        handleCodeChange,
        editorRef,
        params,
        setParams,
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = (): ToolsProps => useContext(ToolsContext);
