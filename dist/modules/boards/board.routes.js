"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const board_controller_js_1 = require("./board.controller.js");
const router = (0, express_1.Router)();
router.post("/", board_controller_js_1.createBoardController);
router.get("/:id", board_controller_js_1.getBoardController);
exports.default = router;
