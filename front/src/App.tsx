import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { router } from "./Router";
import { theme } from "./theme";
import { RouterProvider } from "react-router-dom";
import { ToolsProvider } from "./components/CodeCompletionToolsProviders";

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <ToolsProvider>
        <RouterProvider router={router} />
      </ToolsProvider>
    </MantineProvider>
  );
}
