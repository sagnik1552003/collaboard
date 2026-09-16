"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoard = createBoard;
exports.getBoard = getBoard;
const prisma_js_1 = __importDefault(require("../../lib/prisma.js"));
async function createBoard(name) {
    const board = await prisma_js_1.default.board.create({
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
async function getBoard(boardId) {
    return prisma_js_1.default.board.findUnique({
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
