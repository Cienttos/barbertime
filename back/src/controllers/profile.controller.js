import { supabaseAdmin } from "../../supabaseClient.js";
import multer from "multer";
import sharp from "sharp";

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    res.status(200).json(profile);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { full_name, phone_number, avatar_url, extra_data } = req.body;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name, phone_number, avatar_url, extra_data })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update profile", details: error.message });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    // 1. El middleware `multer` (configurado en profile.routes.js) ya procesó el archivo
    // y lo adjuntó a `req.file`. El archivo se encuentra en memoria como un Buffer.
    console.log("🔄 [updateAvatar] Petición para subir avatar recibida.");
    const user = req.user;
    console.log("[updateAvatar] Authenticated user:", user);

    if (!req.file) {
      console.error("❌ [updateAvatar] No se recibió ningún archivo.");
      return res.status(400).json({ error: "No se subió ningún archivo." });
    }
    console.log("📄 [updateAvatar] Archivo recibido (req.file):", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // 2. Usar `sharp` para procesar la imagen: redimensionar y convertir a formato WebP.
    // Esto optimiza la imagen para la web.
    console.log(
      "⏳ [updateAvatar] Redimensionando y convirtiendo imagen a webp..."
    );
    const resizedImageBuffer = await sharp(req.file.buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    console.log("✅ [updateAvatar] Imagen procesada exitosamente.");

    // 3. Definir la ruta donde se guardará el archivo en Supabase Storage.
    // Se usa el ID del usuario para asegurar una ruta única.
    const filePath = `avatars/${user.id}/avatar.webp`;
    const contentType = "image/webp";

    // 4. Subir el buffer de la imagen procesada a Supabase Storage.
    console.log(
      `⏳ [updateAvatar] Subiendo avatar a Supabase Storage en: ${filePath}`
    );
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars") // El nombre del bucket es "avatars"
      .upload(filePath, resizedImageBuffer, {
        contentType,
        upsert: true, // `upsert: true` sobreescribe el archivo si ya existe.
      });

    if (uploadError) {
      console.error("❌ [updateAvatar] Supabase upload error:", uploadError);
      throw uploadError;
    }
    console.log(
      "✅ [updateAvatar] Avatar subido a Supabase Storage con éxito."
    );

    // 5. Obtener la URL pública del archivo recién subido.
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Se añade un timestamp a la URL para evitar problemas de caché en el cliente.
    const avatar_url = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

    // 6. Devolver la URL pública al cliente.
    // El frontend usará esta URL para actualizar el perfil del usuario en un paso posterior.
    res.status(200).json({ message: "Avatar subido con éxito", avatar_url });
  } catch (error) {
    console.error("💥 [updateAvatar] Error en el servidor:", error.message);
    res
      .status(500)
      .json({ error: "Error al actualizar el avatar", details: error.message });
  }
};
