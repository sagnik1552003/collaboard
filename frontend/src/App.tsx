import { useRoute } from "./hooks/useRoute";
import Home from "./pages/Home";
import BoardPage from "./pages/Board";

export default function App() {
  const { path, navigate } = useRoute();
  const boardMatch = path.match(/^\/board\/([^/]+)$/);

  if (boardMatch) {
    return <BoardPage boardId={boardMatch[1]} navigate={navigate} />;
  }

  return <Home navigate={navigate} />;
}
