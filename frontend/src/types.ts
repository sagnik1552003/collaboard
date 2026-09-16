export interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  columnId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  name: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  columns: Column[];
}

export interface Presence {
  socketId: string;
  userName: string;
}
