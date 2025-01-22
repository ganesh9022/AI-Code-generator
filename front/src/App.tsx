import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { router } from "./Router";
import { theme } from "./theme";
import { RouterProvider } from "react-router-dom";
import { ToolsProvider } from "./components/CodeCompletionToolsProviders";
import { ClerkProvider } from "@clerk/clerk-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable key')
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <MantineProvider theme={theme}>
        <ToolsProvider>
          <RouterProvider router={router} />
        </ToolsProvider>
        <ToastContainer />
      </MantineProvider>
    </ClerkProvider>
  );
}
