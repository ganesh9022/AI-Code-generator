import {
  Route,
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
} from "react-router-dom"
import EditorPage from "./pages/Editor"
import { AppLayout } from "./components/Layout/appLayout"
import ChatPage from "./pages/Chat"
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<AppLayout />}>
        
        <Route index element={<Navigate to="/editor" replace />} />
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
