import User from "../models/User.js";
import {
  SESSION_COOKIE,
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from "../lib/session.js";

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(/[\s,]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const publicUser = (user) => ({
  _id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  imageUrl: user.imageUrl,
  createdAt: user.createdAt,
});

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
};

const protectRoute = (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE] ?? getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized -> You are not logged in",
    });
  }

  try {
    const payload = verifySessionToken(token);
    if (typeof payload !== "object" || !payload.sub) {
      return res.status(401).json({ success: false, message: "Invalid session" });
    }

    req.userId = payload.sub;
    req.userEmail = typeof payload.email === "string" ? payload.email : "";
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again.",
    });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE] ?? getBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifySessionToken(token);
    if (typeof payload === "object" && payload.sub) {
      req.userId = payload.sub;
      req.userEmail = typeof payload.email === "string" ? payload.email : "";
    }
  } catch {
    // Invalid or expired sessions are treated as signed out.
  }
  next();
};

const isAdminUser = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("email");
    const admins = adminEmails();
    const userEmail = user?.email?.toLowerCase() ?? req.userEmail?.toLowerCase() ?? "";
    const isAdmin = admins.length > 0 && admins.includes(userEmail);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden -> You are not an admin",
      });
    }

    next();
  } catch (error) {
    console.error("Error in admin check middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { protectRoute, optionalAuth, isAdminUser };
