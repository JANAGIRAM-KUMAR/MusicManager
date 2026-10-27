import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "soundwave_session";
const SESSION_DAYS = 7;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60 * 1000;

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
};

export const createSessionToken = (user) =>
  jwt.sign(
    {
      email: user.email,
      name: user.fullName,
    },
    getSecret(),
    {
      subject: user._id.toString(),
      expiresIn: `${SESSION_DAYS}d`,
    }
  );

export const verifySessionToken = (token) => jwt.verify(token, getSecret());

export const sessionCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProd ? "lax" : "none",
    secure: isProd ? true : false,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
};

export const clearSessionCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProd ? "lax" : "none",
    secure: isProd ? true : false,
    path: "/",
  };
};
