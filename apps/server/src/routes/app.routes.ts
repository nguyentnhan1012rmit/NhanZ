import { Router } from "express";
import { getMyConversations, createOrGetConversation } from "../controllers/conversation.controller";
import { getAllUsers, updateProfile } from "../controllers/user.controller";
import { updateAvatar, upload } from "../controllers/upload.controller";

const router = Router();

// Conversations
router.get("/", getMyConversations);
router.post("/", createOrGetConversation);

// Users (Contacts)
router.get("/users", getAllUsers);
router.put("/users/profile", updateProfile);

// Uploads
router.post("/users/avatar", upload.single("avatar"), updateAvatar);

export default router;
