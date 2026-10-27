import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  SESSION_COOKIE,
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookieOptions,
} from "../lib/session.js";

const adminEmail = () => (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

const publicUser = (user) => ({
  _id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  imageUrl: user.imageUrl,
  createdAt: user.createdAt,
});

const isAdmin = (user) =>
  Boolean(user?.email && user.email.toLowerCase() === adminEmail());

const googleLogin = async (req, res, next) => {
  try {
    const credential = req.body?.credential ?? req.body?.idToken;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(503).json({
        success: false,
        message: "Google sign-in is not configured on the server",
      });
    }

    if (!credential || typeof credential !== "string") {
      return res.status(400).json({
        success: false,
        message: "A Google credential is required",
      });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      return res.status(401).json({
        success: false,
        message: "Google account email could not be verified",
      });
    }

    const email = payload.email.toLowerCase();
    const profile = {
      googleId: payload.sub,
      email,
      fullName: payload.name?.trim() || email.split("@")[0],
      imageUrl: payload.picture ?? "",
    };

    let user;
    try {
      user = await User.findOne({ googleId: payload.sub });
      if (!user) user = await User.findOne({ email });

      if (user) {
        user.googleId = profile.googleId;
        user.email = profile.email;
        user.fullName = profile.fullName;
        user.imageUrl = profile.imageUrl;
        await user.save();
      } else {
        user = await User.create(profile);
      }
    } catch (dbErr) {
      console.error("DB error during Google auth, using in-memory user:", dbErr.message);
      user = {
        _id: payload.sub,
        email: profile.email,
        fullName: profile.fullName,
        imageUrl: profile.imageUrl,
        createdAt: new Date(),
      };
    }

    const token = createSessionToken(user);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

    return res.status(200).json({
      success: true,
      user: publicUser(user),
      isAdmin: isAdmin(user),
      token,
    });
  } catch (error) {
    console.error("Error verifying Google credential:", error);
    return res.status(401).json({
      success: false,
      message: "Google sign-in failed. Please try again.",
    });
  }
};

const register = async (req, res, next) => {
  try {
    const fullName = typeof req.body?.fullName === "string" ? req.body.fullName.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let user;
    try {
      user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        authProvider: "local",
        imageUrl: "",
      });
    } catch (dbErr) {
      console.error("DB error during registration:", dbErr.message);
      return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
    }

    const token = createSessionToken(user);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

    return res.status(201).json({
      success: true,
      user: publicUser(user),
      isAdmin: isAdmin(user),
      token,
    });
  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

const login = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = createSessionToken(user);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

    return res.status(200).json({
      success: true,
      user: publicUser(user),
      isAdmin: isAdmin(user),
      token,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

const getSession = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(200).json({ success: true, user: null, isAdmin: false });
    }

    let user = null;
    try {
      user = await User.findById(req.userId);
    } catch (dbErr) {
      console.error("DB error during session fetch:", dbErr.message);
    }

    if (!user) {
      // Don't clear cookie if DB is down - be lenient
      return res.status(200).json({
        success: true,
        user: {
          _id: req.userId,
          fullName: req.userEmail?.split("@")[0] || "User",
          email: req.userEmail,
          imageUrl: "",
          createdAt: new Date(),
        },
        isAdmin: isAdmin({ email: req.userEmail }),
      });
    }

    return res.status(200).json({
      success: true,
      user: publicUser(user),
      isAdmin: isAdmin(user),
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions());
  return res.status(200).json({ success: true });
};

const oauthCallback = async (req, res, next) => {
  try {
    const oidc = req.oidc?.user || req.user;
    const email = oidc?.email?.toLowerCase();
    const sub = oidc?.sub || oidc?.id;
    if (!email || !sub) {
      return res.status(400).json({ success: false, message: "OAuth profile missing" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        fullName: oidc.name || oidc.given_name || email.split("@")[0],
        imageUrl: oidc.picture || "",
        authProvider: "oauth",
      });
    }

    const token = createSessionToken(user);
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    const redirectUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth callback error:", error);
    const redirectUrl = process.env.FRONTEND_URL?.split(",")[0] || "http://localhost:3000";
    return res.redirect(`${redirectUrl}/?error=auth_failed`);
  }
};

export { googleLogin, register, login, getSession, logout, oauthCallback };
