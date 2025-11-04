import { supabaseAdmin } from "../utils/supabase.js";

export const getAllBarberAvailability = async () => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, extra_data")
    .eq("role", "barber");

  if (error) {
    throw error;
  }

  return data.map((barber) => ({
    barber_id: barber.id,
    full_name: barber.full_name,
    availability: barber.extra_data.availability,
  }));
};

export const getBarberProfile = async (barberId) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("extra_data")
    .eq("id", barberId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateBarberExtraData = async (barberId, extraData) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ extra_data: extraData })
    .eq("id", barberId)
    .select("extra_data")
    .single();

  if (error) throw error;

  return data;
};

export const getBarberAvailability = async (barberId) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("extra_data")
    .eq("id", barberId)
    .single();

  if (error) {
    throw error;
  }

  if (!data || !data.extra_data || !data.extra_data.availability) {
    return null;
  }

  return data.extra_data.availability;
};
