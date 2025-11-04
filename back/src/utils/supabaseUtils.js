import { supabaseAdmin } from "../../supabaseClient.js";
import { Buffer } from "buffer";

// Helper function to upload image to Supabase Storage
export const uploadImageToSupabase = async (
  userId,
  base64Image,
  contentType,
  fileName = "avatar.png"
) => {
  const filePath = `avatars/${userId}/${fileName}`;
  const imageBuffer = Buffer.from(base64Image, "base64");

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(filePath, imageBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("avatars")
    .getPublicUrl(filePath);
  return publicUrlData.publicUrl;
};
