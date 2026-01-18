import { Router } from "express";
import { getMessages, getGeneralConversation } from "../controllers/message.controller";

const router = Router();

router.get("/general", getGeneralConversation);
router.get("/:conversationId", getMessages);

export default router;
