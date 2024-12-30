import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { router } from "./Router";
import { theme } from "./theme";
import { RouterProvider } from "react-router-dom";
import { ToolsProvider } from "./components/CodeCompletionToolsProviders";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { WelcomePage } from "./components/authentication/WelcomePage";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable key')
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <MantineProvider theme={theme}>
        <SignedOut>
          <WelcomePage/> 
        </SignedOut>
        <SignedIn>
          <ToolsProvider>
            <RouterProvider router={router} />
          </ToolsProvider>
        </SignedIn>
      </MantineProvider>
    </ClerkProvider>
  );
}
