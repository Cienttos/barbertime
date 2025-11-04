-- Create a table for public profiles
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  extra_data JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT phone_number_length CHECK (phone_number IS NULL OR phone_number = '' OR char_length(phone_number) >= 7)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- This trigger automatically creates a profile for new users.
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, extra_data)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', '{}'::jsonb);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Custom claim to get user role
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT)
RETURNS TEXT AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> claim,
    ''
  )
$$ LANGUAGE SQL STABLE;

-- Policies for admin access
CREATE POLICY "Admins can view all profiles." ON profiles
  FOR SELECT USING (get_my_claim('role') = '"admin"');

CREATE POLICY "Admins can update any profile." ON profiles
  FOR UPDATE USING (get_my_claim('role') = '"admin"') WITH CHECK (get_my_claim('role') = '"admin"');

-- Storage for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can update their own avatar." ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own avatar." ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Table for general shop data
CREATE TABLE general (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE general ENABLE ROW LEVEL SECURITY;

CREATE POLICY "General data is publicly viewable." ON general
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert general data." ON general
  FOR INSERT WITH CHECK (get_my_claim('role') = '"admin"');

CREATE POLICY "Admins can update general data." ON general
  FOR UPDATE USING (get_my_claim('role') = '"admin"');

CREATE POLICY "Admins can delete general data." ON general
  FOR DELETE USING (get_my_claim('role') = '"admin"');

-- Table for services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are publicly viewable." ON services
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert services." ON services
  FOR INSERT WITH CHECK (get_my_claim('role') = '"admin"');

CREATE POLICY "Admins can update services." ON services
  FOR UPDATE USING (get_my_claim('role') = '"admin"');

CREATE POLICY "Admins can delete services." ON services
  FOR DELETE USING (get_my_claim('role') = '"admin"');

-- Table for appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  barber_id UUID REFERENCES profiles(id), -- Can be null if not assigned yet
  service_id UUID NOT NULL REFERENCES services(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_date DATE, -- Columna para la fecha de la cita
  status TEXT NOT NULL DEFAULT 'reservado', -- 'reservado', 'en proceso', 'completado', 
  notes jsonb DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS for appointments
CREATE POLICY "Clients can view their own appointments." ON appointments
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Barbers can view their assigned appointments." ON appointments
  FOR SELECT USING (auth.uid() = barber_id);

CREATE POLICY "Admins can view all appointments." ON appointments
  FOR SELECT USING (get_my_claim('role') = '"admin"');

CREATE POLICY "Clients can create appointments." ON appointments
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Allow clients to update their own appointments to cancel them if 'Reservado', or to add notes if 'Completado'.
CREATE POLICY "Clients can update their own appointments for specific actions." ON appointments
  FOR UPDATE USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id AND
    (status = 'Reservado' OR status = 'Completado'));

CREATE POLICY "Barbers can update their assigned appointments (e.g., status)." ON appointments
  FOR UPDATE USING (auth.uid() = barber_id) WITH CHECK (auth.uid() = barber_id);

CREATE POLICY "Admins can update any appointment." ON appointments
  FOR UPDATE USING (get_my_claim('role') = '"admin"');

CREATE POLICY "Admins can delete any appointment." ON appointments
  FOR DELETE USING (get_my_claim('role') = '"admin"');
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  barber_id uuid,
  service_id uuid NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  appointment_date date,
  status text NOT NULL DEFAULT 'reservado'::text,
  notes jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT appointments_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES public.profiles(id),
  CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.general (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT general_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  full_name text,
  phone_number text CHECK (char_length(phone_number) >= 7),
  avatar_url text,
  role text NOT NULL DEFAULT 'user'::text,
  extra_data jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_minutes integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

ALTER TABLE public.appointments
ADD COLUMN price NUMERIC;

COMMENT ON COLUMN public.appointments.price IS 'Price of the service at the time of booking.';