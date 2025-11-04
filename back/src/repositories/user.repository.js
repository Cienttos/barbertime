import { supabaseAdmin } from "../utils/supabase.js";

export const getAllUsers = async () => {
  const { data: users, error } = await supabaseAdmin.from("profiles").select("*");

  if (error) {
    throw error;
  }

  return users;
};

export const updateUserRole = async (id, role) => {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select();

  if (profileError) {
    throw profileError;
  }

  if (profileData.length === 0) {
    return null;
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    app_metadata: { role: role },
  });

  if (userError) {
    throw userError;
  }

  return profileData[0];
};