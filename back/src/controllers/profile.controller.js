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
    const { full_name, phone_number } = req.body;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name, phone_number })
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
    console.log("🔄 [updateAvatar] Request to upload avatar received.");
    const user = req.user;

    if (!req.file) {
      console.error("❌ [updateAvatar] No file uploaded.");
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("📄 [updateAvatar] File received:", req.file.originalname);

    console.log("⏳ [updateAvatar] Resizing and converting image to webp...");
    const resizedImageBuffer = await sharp(req.file.buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    console.log("✅ [updateAvatar] Image resized and converted successfully.");

    const filePath = `avatars/${user.id}/avatar.webp`;
    const contentType = "image/webp";

    console.log(
      `⏳ [updateAvatar] Uploading avatar to Supabase Storage at path: ${filePath}`
    );
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, resizedImageBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) throw uploadError;
    console.log(
      "✅ [updateAvatar] Avatar uploaded to Supabase Storage successfully."
    );

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const avatar_url = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();

    if (profileError) throw profileError;

    res.status(200).json({ message: "Avatar updated successfully", profile });
  } catch (error) {
    console.error("💥 [updateAvatar] Server error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to update avatar", details: error.message });
  }
};
