import { supabaseAdmin } from "../utils/supabase.js";

const GENERAL_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export const getGeneralData = async () => {
  const { data, error } = await supabaseAdmin
    .from("general")
    .select("data")
    .eq("id", GENERAL_SETTINGS_ID)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data?.data || {};
};

export const updateGeneralData = async (settings) => {
  const { data, error } = await supabaseAdmin
    .from("general")
    .upsert({ id: GENERAL_SETTINGS_ID, data: settings }, { onConflict: "id" })
    .select();

  if (error) {
    throw error;
  }

  return data[0];
};

export const getBlockedDates = async () => {
  const { data, error } = await supabaseAdmin
    .from("general")
    .select("data")
    .eq("id", GENERAL_SETTINGS_ID)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data?.data?.blocked_dates || [];
};