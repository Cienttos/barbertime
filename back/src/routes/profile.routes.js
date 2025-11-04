import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  upload,
} from "../controllers/profile.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticateUser, getProfile);
router.put("/", authenticateUser, updateProfile);
router.post("/avatar", authenticateUser, upload.single("avatar"), updateAvatar);

export default router;
