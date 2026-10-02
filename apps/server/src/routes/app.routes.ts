import { Router } from "express";
import { getMyConversations, createOrGetConversation, createGroupConversation, addMembers, removeMember, leaveGroup } from "../controllers/conversation.controller";
import { getAllUsers, updateProfile } from "../controllers/user.controller";
import { updateAvatar, removeAvatar, upload } from "../controllers/upload.controller";

const router = Router();

// Conversations
router.get("/", getMyConversations);
router.post("/", createOrGetConversation);
router.post("/group", createGroupConversation);
router.post("/:id/members", addMembers);
router.delete("/:id/members/:userId", removeMember);
router.delete("/:id/leave", leaveGroup);

// Users (Contacts)
router.get("/users", getAllUsers);
router.put("/users/profile", updateProfile);

// Uploads
router.post("/users/avatar", upload.single("avatar"), updateAvatar);
router.delete("/users/avatar", removeAvatar);

export default router;
