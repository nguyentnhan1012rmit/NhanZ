import { Router } from "express";
import { getMessages, getGeneralConversation, toggleReaction, editMessage, deleteMessage, markAsRead, getReadReceipts, togglePinMessage } from "../controllers/message.controller";
import { upload, uploadAttachment } from "../controllers/upload.controller";

const router = Router();

router.post("/upload", upload.single("attachment"), uploadAttachment);
router.get("/general", getGeneralConversation);
router.get("/:conversationId/receipts", getReadReceipts);
router.get("/:conversationId", getMessages);
router.post("/:messageId/react", toggleReaction);
router.post("/:conversationId/read", markAsRead);
router.put("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);
router.post("/:messageId/pin", togglePinMessage);

export default router;
