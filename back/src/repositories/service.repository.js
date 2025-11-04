import { supabaseAdmin } from "../utils/supabase.js";

export const getServiceDuration = async (serviceId) => {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (error) {
    throw error;
  }

  return data?.duration_minutes;
};