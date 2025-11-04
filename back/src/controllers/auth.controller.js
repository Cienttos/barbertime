import { supabaseAdmin } from "../../supabaseClient.js";
import { Buffer } from "buffer";
import fetch from "node-fetch";
import { uploadImageToSupabase } from "../utils/supabaseUtils.js";

export const register = async (req, res) => {
  console.log("➡️ [Backend] Petición de registro recibida.");
  const { email, password } = req.body;
  console.log(
    "➡️ [Backend] Datos de registro - Email:",
    email,
    "Password (length):",
    password.length
  );

  try {
    // First, sign up the user
    const { data: signUpData, error: signUpError } =
      await supabaseAdmin.auth.signUp({
        email,
        password,
      });

    if (signUpError) {
      console.error("❌ Supabase Register Error:", signUpError.message);
      return res.status(400).json({ error: signUpError.message });
    }

    if (!signUpData.user) {
      console.error("❌ Supabase Register Error: User not created.");
      return res.status(500).json({ error: "User not created" });
    }

    const user = signUpData.user;

    // Then, create a profile for the new user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          role: "client",
          full_name: user.email.split("@")[0], // Default full_name
          avatar_url: "https://www.gravatar.com/avatar/?d=mp", // Default avatar
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (profileError) {
      console.error("❌ Error creating user profile:", profileError.message);
      // Not returning here, as the user is already created.
      // We can still try to sign them in.
    }

    res.status(201).json({
      message:
        "Registration successful. Please check your email to confirm your account and then log in.",
      user,
    });
  } catch (error) {
    console.error("💥 Server error during registration:", error.message);
    res.status(500).json({
      error: "Server error during registration",
      details: error.message,
    });
  }
};

export const login = async (req, res) => {
  console.log("➡️ [Backend] Petición de login recibida.");
  const { email, password } = req.body;
  console.log(
    "➡️ [Backend] Datos de login - Email:",
    email,
    "Password (length):",
    password.length
  );

  try {
    const { data: signInData, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      console.error("❌ [Backend] Supabase Login Error:", signInError.message);
      return res.status(400).json({ error: signInError.message });
    }

    if (!signInData.user) {
      console.error(
        "❌ [Backend] Login Fallido: Usuario no encontrado después de signInWithPassword."
      );
      return res.status(400).json({ error: "User not found" });
    }

    console.log(
      "✅ [Backend] signInWithPassword exitoso. User ID:",
      signInData.user.id
    );
    const user = signInData.user;

    // Fetch the user's profile
    console.log("🔄 [Backend] Buscando/creando perfil para User ID:", user.id);
    let { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create it
    if (profileError && profileError.code === "PGRST116") {
      console.warn(
        `⚠️ [Backend] Perfil no encontrado para el usuario ${user.id}. Creando uno.`
      );
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            role: "client",
            full_name: user.email.split("@")[0],
            avatar_url: "https://www.gravatar.com/avatar/?d=mp",
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (createError) {
        console.error(
          "❌ [Backend] Error creando perfil de usuario en login:",
          createError.message
        );
        // Still return session, frontend will handle incomplete profile
      } else {
        console.log("✅ [Backend] Perfil creado exitosamente en login.");
        profile = newProfile;
      }
    } else if (profileError) {
      console.error(
        "❌ [Backend] Error obteniendo perfil de usuario:",
        profileError.message
      );
    }

    console.log("✅ [Backend] Login exitoso. Enviando sesión y perfil.");
    res.status(200).json({
      message: "Login successful",
      session: signInData.session,
      profile,
    });
  } catch (error) {
    console.error("💥 Server error during login:", error.message);
    res
      .status(500)
      .json({ error: "Server error during login", details: error.message });
  }
};

export const googleSignIn = async (req, res) => {
  const { id_token } = req.body;

  console.log("🔄 [Backend] Iniciando Google Sign-In con ID Token.");

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
      provider: "google",
      token: id_token,
    });

    if (error) {
      console.error(
        "❌ [Backend] Supabase Google Sign-In Error:",
        error.message
      );
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ [Backend] Google Sign-In exitoso. User ID:", data.user?.id);

    const user = data.user;
    let avatar_url = null;

    // If Google user has a picture, download and upload it to Supabase Storage
    if (user && user.user_metadata?.picture) {
      console.log(
        `🔄 Downloading Google avatar for user ${user.id}: ${user.user_metadata.picture}`
      );
      const response = await fetch(user.user_metadata.picture);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString("base64");
        const contentType = response.headers.get("content-type") || "image/png";
        avatar_url = await uploadImageToSupabase(
          user.id,
          base64Image,
          contentType
        );
        console.log(
          `✅ Google avatar uploaded to Supabase Storage: ${avatar_url}`
        );
      } else {
        console.warn(
          `⚠️ Failed to download Google avatar: ${response.statusText}.`
        );
      }
    }

    // Create or update profile entry for the Google user
    if (user) {
      console.log("🔄 [Backend] Upserting profile for Google user:", user.id);
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            role: "client",
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email.split("@")[0],
            avatar_url: avatar_url, // Use uploaded avatar or Google picture
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.error(
          "❌ [Backend] Error upserting user profile after Google sign-in:",
          profileError.message
        );
      } else {
        console.log(
          "✅ [Backend] Perfil de Google user upserted exitosamente."
        );
      }
    }

    console.log("✅ [Backend] Google sign-in process completed.");
    res
      .status(200)
      .json({ message: "Google sign-in successful", session: data.session });
  } catch (error) {
    console.error("💥 Server error during Google sign-in:", error.message);
    res.status(500).json({
      error: "Server error during Google sign-in",
      details: error.message,
    });
  }
};

export const syncProfile = async (req, res) => {
  try {
    // La validación del token se hace aquí, no en un middleware
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    // Obtenemos el usuario directamente desde el token proporcionado
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      return res
        .status(401)
        .json({ error: "Invalid token", details: userError.message });
    }

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Obtenemos el perfil existente para no sobreescribir datos importantes
    // Se modifica la consulta para que no lance un error si no encuentra el perfil.
    const { data: existingProfile, error: profileFetchError } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Ignoramos el error específico 'PGRST116' que significa "cero filas encontradas",
    // ya que es un caso esperado para usuarios nuevos.
    if (profileFetchError && profileFetchError.code !== "PGRST116") {
      throw profileFetchError; // Lanzamos cualquier otro error de base de datos.
    }

    let avatar_url = null;

    // If it's a Google sign-in and there's a picture in the metadata, and no avatar_url yet
    if (
      user.app_metadata.provider === "google" &&
      user.user_metadata?.picture &&
      !existingProfile?.avatar_url // Usamos el perfil que acabamos de obtener
    ) {
      console.log(
        `🔄 Downloading Google avatar for user ${user.id}: ${user.user_metadata.picture}`
      );
      try {
        const response = await fetch(user.user_metadata.picture);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64Image = Buffer.from(arrayBuffer).toString("base64");
          const contentType =
            response.headers.get("content-type") || "image/png";
          avatar_url = await uploadImageToSupabase(
            user.id,
            base64Image,
            contentType
          );
          console.log(
            `✅ Google avatar uploaded to Supabase Storage: ${avatar_url}`
          );
        } else {
          console.warn(
            `⚠️ Failed to download Google avatar: ${response.statusText}.`
          );
        }
      } catch (fetchError) {
        console.error(`💥 Error fetching Google avatar: ${fetchError.message}`);
      }
    }

    const profileData = {
      id: user.id,
      full_name:
        existingProfile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email.split("@")[0],
      avatar_url:
        avatar_url ||
        existingProfile?.avatar_url ||
        "https://www.gravatar.com/avatar/?d=mp",
      role: existingProfile?.role || "client",
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData, { onConflict: "id" })
      .select()
      .single();

    if (profileError) {
      console.error(
        "❌ Error upserting user profile after sync:",
        profileError.message
      );
      return res.status(500).json({ error: "Failed to sync profile" });
    }

    return res
      .status(200)
      .json({ message: "Profile synced successfully", profile });
  } catch (error) {
    console.error("💥 Server error during profile sync:", error.message);
    res.status(500).json({
      error: "Server error during profile sync",
      details: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.signOut();

    if (error) {
      console.error("❌ Supabase Logout Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("💥 Server error during logout:", error.message);
    res
      .status(500)
      .json({ error: "Server error during logout", details: error.message });
  }
};
