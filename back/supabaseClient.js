import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://yhevsnwowrwzmmoaezaj.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXZzbndvd3J3em1tb2FlemFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU5MDI4NCwiZXhwIjoyMDc3MTY2Mjg0fQ.v6z8iPR-JFmTthyJTSe3MyO6HWQLVkvcXPSUQMHh7s0";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXZzbndvd3J3em1tb2FlemFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1OTAyODQsImV4cCI6MjA3NzE2NjI4NH0.ieC-NOhUx1WsHhBc6lL8LvIDwsciF1ZJiJB5vT69-OQ";



export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Public client for user-level operations like token verification
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
