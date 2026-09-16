import type { Board } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function createBoard(name: string) {
  return request<Board>("/api/boards", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getBoard(boardId: string) {
  return request<Board>(`/api/boards/${boardId}`);
}

export { ApiError };
