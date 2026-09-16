import { FormEvent, useState } from "react";
import { createBoard, getBoard, ApiError } from "../lib/api";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "./Home.css";

interface HomeProps {
  navigate: (path: string) => void;
}

export default function Home({ navigate }: HomeProps) {
  const [userName, setUserName] = useLocalStorage("collaboard:userName", "");
  const [boardName, setBoardName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function enterBoard(boardId: string) {
    navigate(`/board/${boardId}`);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!userName.trim()) return setError("Enter your name first.");
    if (!boardName.trim()) return setError("Give the board a name.");

    setBusy("create");
    try {
      const board = await createBoard(boardName.trim());
      enterBoard(board.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the board.");
    } finally {
      setBusy(null);
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!userName.trim()) return setError("Enter your name first.");
    if (!joinId.trim()) return setError("Paste a board ID to join.");

    setBusy("join");
    try {
      const board = await getBoard(joinId.trim());
      enterBoard(board.id);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "No board with that ID."
          : "Couldn't reach that board."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="home">
      <div className="home-wordmark">
        <span className="live-dot" aria-hidden="true" />
        Collaboard
      </div>

      <div className="home-hero">
        <h1>
          Board up.
          <br />
          Work together, live.
        </h1>
        <p className="home-sub">
          One board, three lanes, everyone watching the same cards move in real time.
        </p>
      </div>

      <div className="home-panels">
        <form className="home-panel" onSubmit={handleCreate}>
          <h2>Start a board</h2>
          <div className="field">
            <label htmlFor="board-name">Board name</label>
            <input
              id="board-name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Sprint 14"
              maxLength={100}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy === "create"}>
            {busy === "create" ? "Creating…" : "Create board"}
          </button>
        </form>

        <form className="home-panel" onSubmit={handleJoin}>
          <h2>Join a board</h2>
          <div className="field">
            <label htmlFor="board-id">Board ID</label>
            <input
              id="board-id"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Paste an ID a teammate shared"
            />
          </div>
          <button className="btn btn-ghost" type="submit" disabled={busy === "join"}>
            {busy === "join" ? "Joining…" : "Join board"}
          </button>
        </form>
      </div>

      <div className="home-name field">
        <label htmlFor="user-name">Your name</label>
        <input
          id="user-name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="What should others see?"
          maxLength={40}
        />
      </div>

      {error && <p className="home-error" role="alert">{error}</p>}
    </div>
  );
}
