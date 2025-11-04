import { Router } from "express";
import * as publicController from "../controllers/public.controller.js";

const router = Router();

// @desc    Obtiene la configuración general de la tienda
router.get("/shop-info", publicController.getShopInfo);

// @desc    Obtiene la lista de barberos
router.get("/barbers", publicController.getBarbers);

// @desc    Obtiene la lista de servicios
router.get("/services", publicController.getServices);

export default router;
