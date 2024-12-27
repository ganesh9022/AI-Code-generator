import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { router } from "./Router";
import { theme } from "./theme";
import { RouterProvider } from "react-router-dom";
import { ToolsProvider } from "./components/CodeCompletionToolsProviders";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

export default function App() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
        <MantineProvider theme={theme}>
          <ToolsProvider>
            <RouterProvider router={router} />
          </ToolsProvider>
        </MantineProvider>
      </SignedIn>
    </header>
  );
}
