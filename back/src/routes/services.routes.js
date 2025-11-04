import express from "express";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/services.controller.js";
import { authenticateUser, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(getServices)
  .post(authenticateUser, authorize(["admin"]), createService);
router
  .route("/:id")
  .put(authenticateUser, authorize(["admin"]), updateService)
  .delete(authenticateUser, authorize(["admin"]), deleteService);

export default router;
