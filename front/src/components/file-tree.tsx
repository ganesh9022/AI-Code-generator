import React, { useState } from 'react';
import { Directory, File, sortDir, sortFile } from '../../src/utils/file-manager';
import styled from "@emotion/styled";
import { getIcon } from './icon';
import { useTools, Params } from './CodeCompletionToolsProviders';

interface FileTreeProps {
  rootDir: Directory;
  selectedFile: File | undefined;
  onSelect: (file: File) => void;
}

export const FileTree = (props: FileTreeProps) => {
  return <SubTree directory={props.rootDir} {...props} />
}

interface SubTreeProps {
  directory: Directory;
  selectedFile: File | undefined;
  onSelect: (file: File) => void;
}

const SubTree = (props: SubTreeProps) => {
  const { isEditorVisible, setIsEditorVisible, setLanguage, setParams } = useTools();

  const extensionToLanguageMap: { [key: string]: "javascript" | "typescript" | "python" | "java" | "php" } = {
    js: "javascript",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    py: "python",
    java: "java",
    php: "php",
  };

  const handleFileSelect = (file: File) => {
    props.onSelect(file);
    setIsEditorVisible(true);
    const fileExtension = file.name.split(".").pop();
    const language = fileExtension && extensionToLanguageMap[fileExtension] ? extensionToLanguageMap[fileExtension] : "javascript";
    setLanguage(language);
    setParams((prevParams: Params) => ({
      ...prevParams,
      language: language,
    }));
  };

  return (
    <div>
      {
        props.directory.dirs
          .sort(sortDir)
          .map(dir => (
            <React.Fragment key={dir.id}>
              <DirDiv
                directory={dir}
                selectedFile={props.selectedFile}
                onSelect={props.onSelect} />
            </React.Fragment>
          ))
      }
      {
        props.directory.files
          .sort(sortFile)
          .map(file => (
            <React.Fragment key={file.id}>
              <FileDiv
                file={file}
                selectedFile={props.selectedFile}
                onClick={() => handleFileSelect(file)} />
            </React.Fragment>
          ))
      }
    </div>
  )
}

const FileDiv = ({ file, icon, selectedFile, onClick }: {
  file: File | Directory;
  icon?: string;
  selectedFile: File | undefined;
  onClick: () => void;
}) => {
  const isSelected = (selectedFile && selectedFile.id === file.id) as boolean;
  const depth = file.depth;
  return (
    <Div
      depth={depth}
      isSelected={isSelected}
      onClick={onClick}>
      <FileIcon
        name={icon}
        extension={file.name.split('.').pop() || ""} />
      <span color="var(--mantine-color-text)" style={{ marginLeft: 1 }}>
        {file.name}
      </span>
    </Div>
  )
}

const Div = styled.div<{
  depth: number;
  isSelected: boolean;
}>`
  width:fit-content;
  display: flex;
  align-items: center;
  padding-left: ${props => props.depth * 16}px;
  background-color: ${props => props.isSelected ? "#4a90e2" : "transparent"};
  padding-right:10px;
  :hover {
    cursor: pointer;
    background-color:#808080;
  }
`

const DirDiv = ({ directory, selectedFile, onSelect }: {
  directory: Directory;
  selectedFile: File | undefined;
  onSelect: (file: File) => void;
}) => {
  let defaultOpen = false;
  if (selectedFile)
    defaultOpen = isChildSelected(directory, selectedFile)
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <FileDiv
        file={directory}
        icon={open ? "openDirectory" : "closedDirectory"}
        selectedFile={selectedFile}
        onClick={() => setOpen(!open)} />
      {
        open ? (
          <SubTree
            directory={directory}
            selectedFile={selectedFile}
            onSelect={onSelect} />
        ) : null
      }
    </>
  )
}


const isChildSelected = (directory: Directory, selectedFile: File) => {
  let res: boolean = false;

  function isChild(dir: Directory, file: File) {
    if (selectedFile.parentId === dir.id) {
      res = true;
      return;
    }
    if (selectedFile.parentId === '0') {
      res = false;
      return;
    }
    dir.dirs.forEach((item) => {
      isChild(item, file);
    })
  }

  isChild(directory, selectedFile);
  return res;
}

const FileIcon = ({ extension, name }: { name?: string, extension?: string }) => {
  let icon = getIcon(extension || "", name || "");
  return (
    <Span>
      {icon}
    </Span>
  )
}

const Span = styled.span`
  display: flex;
  width: 32px;
  height: 32px;
  padding-right:10px
  justify-content: center;
  align-items: center;
`

