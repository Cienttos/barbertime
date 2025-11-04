import express from "express";
import { getUserStats } from "../controllers/stats.controller.js";
import { authenticateUser, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/user").get(authenticateUser, getUserStats);
router
  .route("/user/:userId")
  .get(authenticateUser, authorize(["admin"]), getUserStats);

export default router;
