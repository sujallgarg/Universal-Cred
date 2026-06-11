import { Router } from "express";
import { creditCheck } from "../../middleware/creditCheck.js";
import { handleChatCompletion } from "../../controllers/chat.controller.js";

const router = Router();

// Completion routing path guarded by in-memory credit validation
router.post("/completions", creditCheck, handleChatCompletion);

export default router;
