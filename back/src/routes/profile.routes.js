import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  upload,
} from "../controllers/profile.controller.js";
import { authenticateUser, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticateUser, getProfile);
router.put("/", authenticateUser, updateProfile);
// Ruta para subir un avatar de usuario.
// 1. `authenticateUser`: Middleware que protege la ruta, asegurando que solo usuarios autenticados puedan acceder.
// 2. `upload.single("avatar")`: Middleware de `multer` que procesa una subida de archivo único.
//    - Espera que el archivo venga en el campo `avatar` del FormData.
//    - El archivo se almacena en memoria (`req.file`) para ser procesado por el siguiente controlador.
// 3. `updateAvatar`: El controlador final que toma el archivo de `req.file`, lo procesa y lo sube a Supabase.
router.post("/avatar", authenticateUser, upload.single("avatar"), updateAvatar);

export default router;
