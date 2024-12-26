import {
  Route,
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
} from "react-router-dom"
import { HomePage } from "./pages/Home"
import EditorPage from "./pages/Editor"
import { AppLayout } from "./components/Layout/appLayout"
import ChatPage from "./pages/Chat"
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home">
          <Route index element={<HomePage />} />
        </Route>
        <Route path="editor">
          <Route index element={<EditorPage />} />
        </Route>
        <Route path="chat">
          <Route index element={<ChatPage />} />
        </Route>
      </Route>
    </Route>
  )
)
