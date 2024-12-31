import React from "react";
import { Checkbox, Drawer, FileInput, rem } from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
import { useTools } from "./CodeCompletionToolsProviders";
import CustomFileInput from "./CustomFileInput";

interface SideDrawerProps {
  opened: boolean;
  close: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ opened, close }) => {
  const {
    file,
    setFile,
    showSelectedFileInEditor,
    setShowSelectedFileInEditor,
  } = useTools();
  const icon = (
    <IconFileText style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
  );

  return (
    <Drawer
      opened={opened}
      onClose={close}
      title="More options"
      position="right"
    >
      <FileInput
        leftSection={icon}
        placeholder="Upload your context file"
        leftSectionPointerEvents="none"
        accept=".zip,.txt,.js,.ts,.jsx,.tsx,.json,.py,.java,.php"
        value={file}
        onChange={(files) => {
          if (files) {
            setFile(files);
          }
        }}
        mb={10}
      />
      <Checkbox
        label="Show selected file in editor"
        checked={showSelectedFileInEditor}
        onChange={(event) => {
          setShowSelectedFileInEditor(event.currentTarget.checked);
        }}
      />
      <CustomFileInput />
    </Drawer>
  );
};

export default SideDrawer;
