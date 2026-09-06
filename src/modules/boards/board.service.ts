import prisma from "../../lib/prisma.js";

export async function createBoard(name: string) {
  const board = await prisma.board.create({
    data: {
      name,
      columns: {
        create: [
          {
            name: "Todo",
            position: 0,
          },
          {
            name: "Doing",
            position: 1,
          },
          {
            name: "Done",
            position: 2,
          },
        ],
      },
    },
    include: {
      columns: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  return board;
}

export async function getBoard(boardId: string) {
  return prisma.board.findUnique({
    where: {
      id: boardId,
    },
    include: {
      columns: {
        orderBy: {
          position: "asc",
        },
        include: {
          tasks: {
            orderBy: {
              position: "asc",
            },
          },
        },
      },
    },
  });
}