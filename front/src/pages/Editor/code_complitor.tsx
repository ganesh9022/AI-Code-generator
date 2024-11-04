import React, { useRef, useState } from "react"
import Editor, { OnMount } from "@monaco-editor/react"
import * as monaco from "monaco-editor"
import { Button, Flex, Paper, Select, Title } from "@mantine/core"
import axios from "axios"

const CodeCompletionEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [output, setOutput] = useState<string>("")  
  const [language, setLanguage] = useState<keyof typeof supported_language_versions>("javascript")
  const API = axios.create({
    baseURL: "https://emkc.org/api/v2/piston",
  })
  const supported_language_versions = {
    javascript: "18.15.0",
    typescript: "5.0.3",
    python: "3.10.0",
    java: "15.0.2",
    php: "8.2.3",
  }
  const handleCodeChange = async (currentCode: string) => {
    const trimmedCode = currentCode.trim();

    try {
        const response = await axios.post("http://127.0.0.1:8000/find-function/", {
            function_name: trimmedCode,
        });
        const { function_name, code } = response.data;
        const message = code
            ? `Function: ${function_name}\n\n${code}`: "";
        
        editorRef.current?.setValue( message);
    } catch (error) {
        editorRef.current?.setValue(currentCode + "\nError fetching completion.");
    }
};



  const runCode = async () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue()
      const logs: string[] = []
      const originalConsoleLog = console.log
      handleCodeChange(code)
      console.log = function (...args) {
        logs.push(args.join(" "))
        originalConsoleLog.apply(console, args)
      }

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
        setOutput("Error: " + error)
      }
    }
  }

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor

    editor.onKeyDown((e) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.Enter) {
        e.preventDefault()
        const currentValue = editor.getValue()
        console.log("Editor content changed:", currentValue)
        handleCodeChange(currentValue)
      }
    })
  }

  return (
    <div style={{ height: "90vh" }}>
      <Flex justify="center" align="flex-end" gap="md" my={30}>
        <Button variant="filled" onClick={runCode}>
          Run Code
        </Button>
        <Select
          label="Select Language"
          data={[
            { value: "javascript", label: "JavaScript" },
            { value: "typescript", label: "TypeScript" },
            { value: "python", label: "Python" },
            { value: "php", label: "PHP" },
            { value: "java", label: "Java" },
          ]}
          value={language}
          onChange={(e) => setLanguage(e as keyof typeof supported_language_versions)}
        />
      </Flex>
          
      <Paper style={{ display: "flex", height: "100%" }}>
        <Paper mr={"10px"} w={"50%"}>
          <Editor
            onMount={handleEditorDidMount}
            theme="vs-dark"
            language={language}
          />
        </Paper>

        <Paper
          w={"50%"}
          p={"10px"}
          style={{
            overflowY: "auto",
          }}
        >
          <Title order={4}>Output:</Title>
          <pre>{output || "No output yet"}</pre>
        </Paper>
      </Paper>
    </div>
  )
}

export default CodeCompletionEditor
