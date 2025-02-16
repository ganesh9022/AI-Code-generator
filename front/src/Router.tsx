import {
  Route,
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
} from "react-router-dom"
import EditorPage from "./pages/Editor";
import { AppLayout } from "./components/Layout/appLayout";
import ChatPage from "./pages/Chat";
import MoreOptions from "./pages/MoreOptions";
import GithubLoginPage from "./components/GihubLoginPage";
import CustomFileInput from "./components/CustomFileInput";
import { AuthGuard } from "./components/authentication/AuthGuard";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AuthGuard />}>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/editor" replace />} />
        <Route path="editor">
          <Route index element={<EditorPage />} />
        </Route>
        <Route path="chat">
          <Route index element={<ChatPage />} />
          <Route path=":pageId" element={<ChatPage />} />
          <Route path=":pageId/:messageId" element={<ChatPage />} />
        </Route>
        <Route path="more-options">
          <Route index element={<MoreOptions />} />
          <Route path="github-auth" element={<GithubLoginPage />} />
          <Route path="contextual-response" element={<CustomFileInput />} />
        </Route>
      </Route>
    </Route>
  )
);
