import React from "react";
import { Drawer } from "@mantine/core";
import CustomFileInput from "./CustomFileInput";

interface SideDrawerProps {
  opened: boolean;
  close: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ opened, close }) => {
  return (
    <Drawer
      opened={opened}
      onClose={close}
      title="More options"
      position="right"
    >
      <CustomFileInput />
    </Drawer>
  );
};

export default SideDrawer;
