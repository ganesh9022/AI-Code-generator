import React, { useRef, useState } from "react"
import Editor, { OnMount } from "@monaco-editor/react"
import * as monaco from "monaco-editor"
import { Button, Flex, Paper, Select } from "@mantine/core"
import axios from "axios"

const CodeCompletionEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [output, setOutput] = useState<string>("")  
  const [language, setLanguage] = useState<string>("javascript")

  const handleCodeChange = async (currentCode: string) => {
    const trimmedCode = currentCode.trim();

    try {
        const response = await axios.post("http://127.0.0.1:8001/find-function/", {
            function_name: trimmedCode,
        });
        const { function_name, code } = response.data;
        const message = code
            ? `Function: ${function_name}\n\n${code}`: "";
        
        editorRef.current?.setValue( message);
    } catch (error) {
        console.error("Error fetching code completion:", error);
        editorRef.current?.setValue(currentCode + "\nError fetching completion.");
    }
};



  const runCode = () => {
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
        const result = eval(code);
        console.log = originalConsoleLog;

        const finalOutput =
          logs.join("\n") + (result !== undefined ? `\n${result}` : "")
        setOutput(finalOutput)
      } catch (error) {
        setOutput("Error: " + error)
      } finally {
        console.log = originalConsoleLog
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
            { value: "html", label: "HTML" },
            { value: "css", label: "CSS" },
          ]}
          value={language}
          onChange={(e) => setLanguage(e as string)}
        />
      </Flex>
          
      <Paper style={{ display: "flex", height: "100%" }}>
        <Paper mr={"10px"} w={"50%"}>
          <Editor
            defaultValue={`// Type some Javascript code here and press Ctrl + Enter to run...`}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            language="javascript"
          />
        </Paper>

        <Paper
          w={"50%"}
          bg={"#f4f4f4"}
          p={"10px"}
          style={{
            overflowY: "auto",
          }}
        >
          <h4>Output:</h4>
          <pre>{output || "No output yet"}</pre>
        </Paper>
      </Paper>
    </div>
  )
}

export default CodeCompletionEditor
