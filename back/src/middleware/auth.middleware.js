import { supabase, supabaseAdmin } from "../../supabaseClient.js";

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    // Use the standard supabase client to validate the user's JWT
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return res
        .status(401)
        .json({ error: "Invalid token", details: error.message });
    }

    req.user = data.user;

    // Attach profile to the user object
    // Use supabaseAdmin here to bypass RLS if needed for internal checks
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // Ignore if profile not found
      console.error("Error fetching user profile:", profileError.message);
    }
    req.user.profile = profile;

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Token verification failed", details: error.message });
  }
};

export const authorize = (allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.profile || !req.user.profile.role) {
    return res.status(403).json({ message: "Not authorized, no role found" });
  }
  if (!allowedRoles.includes(req.user.profile.role)) {
    return res.status(403).json({
      message: `User role ${req.user.profile.role} is not authorized to access this route`,
    });
  }
  next();
};
