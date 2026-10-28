import mongoose from "mongoose";

/**
 * HTTP Security Headers Middleware
 * Protects against XSS, clickjacking, MIME sniffing, referrer leaks, and technology disclosure.
 */
export const securityHeaders = (req, res, next) => {
  // Prevent browsers from sniffing MIME types away from the declared Content-Type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by restricting iframe embedding
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Modern browsers: 0 disables legacy buggy auditor
  res.setHeader("X-XSS-Protection", "0");

  // Referrer control: don't leak URLs cross-origin
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict access to sensitive device APIs
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Allow cross-origin media streaming for Cloudinary and audio CDNs
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  // Enforce HTTPS HSTS when in production or on https protocol
  if (
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https"
  ) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Remove Express signature
  res.removeHeader("X-Powered-By");

  next();
};

/**
 * In-Memory Sliding-Window Rate Limiter
 * Tracks requests per IP address with auto-expiring sliding windows.
 */
class SlidingWindowRateLimiter {
  constructor(windowMs, maxRequests, message = "Too many requests. Please try again later.") {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.hits = new Map(); // ip -> [timestamp, timestamp, ...]

    // Periodically sweep expired entries every 2 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 2 * 60 * 1000);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.hits.delete(ip);
      } else {
        this.hits.set(ip, valid);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // Determine client IP reliably behind proxies
      const forwarded = req.headers["x-forwarded-for"];
      const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) ||
        req.socket?.remoteAddress ||
        req.ip ||
        "unknown-ip";

      const now = Date.now();
      const timestamps = this.hits.get(ip) || [];
      const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

      if (validTimestamps.length >= this.maxRequests) {
        const oldest = validTimestamps[0];
        const retryAfterSec = Math.ceil((oldest + this.windowMs - now) / 1000);
        res.setHeader("Retry-After", String(Math.max(1, retryAfterSec)));
        res.setHeader("RateLimit-Limit", String(this.maxRequests));
        res.setHeader("RateLimit-Remaining", "0");
        res.setHeader("RateLimit-Reset", String(Math.ceil((oldest + this.windowMs) / 1000)));

        return res.status(429).json({
          success: false,
          message: this.message,
          retryAfterSeconds: Math.max(1, retryAfterSec),
        });
      }

      validTimestamps.push(now);
      this.hits.set(ip, validTimestamps);

      res.setHeader("RateLimit-Limit", String(this.maxRequests));
      res.setHeader("RateLimit-Remaining", String(this.maxRequests - validTimestamps.length));

      next();
    };
  }
}

// 15 attempts per 15 minutes for authentication
export const authRateLimiter = new SlidingWindowRateLimiter(
  15 * 60 * 1000,
  15,
  "Too many authentication attempts from this IP. Please wait 15 minutes before trying again."
).middleware();

// 300 requests per minute for general API
export const apiRateLimiter = new SlidingWindowRateLimiter(
  60 * 1000,
  300,
  "API rate limit exceeded. Please slow down your requests."
).middleware();

// 30 uploads per 15 minutes for admin asset creation
export const uploadRateLimiter = new SlidingWindowRateLimiter(
  15 * 60 * 1000,
  30,
  "Upload quota rate limit reached. Please wait a few minutes before uploading more tracks or albums."
).middleware();

/**
 * MongoDB ObjectId Validation Middleware
 * Returns 400 Bad Request if any specified parameter is not a valid 24-character hex ObjectId
 */
export const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const val = req.params[param];
      if (val && !mongoose.Types.ObjectId.isValid(val)) {
        return res.status(400).json({
          success: false,
          message: `Invalid resource identifier for '${param}'.`,
        });
      }
    }
    next();
  };
};

/**
 * File Upload Sanitization and Type Validator
 */
export const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
]);

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const validateAudioFile = (file) => {
  if (!file) return { valid: false, error: "Audio file is required" };
  const mime = (file.mimetype || "").toLowerCase();
  const name = file.name || "";
  const ext = name.slice((name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();

  const allowedExts = new Set(["mp3", "wav", "ogg", "aac", "flac", "m4a", "mp4"]);
  if (!ALLOWED_AUDIO_MIMES.has(mime) && !allowedExts.has(ext)) {
    return {
      valid: false,
      error: `Invalid audio format '${mime || ext}'. Allowed: MP3, WAV, OGG, AAC, FLAC, M4A.`,
    };
  }

  // 50 MB max
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: "Audio file exceeds maximum allowed size of 50 MB." };
  }

  return { valid: true };
};

export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: "Image file is required" };
  const mime = (file.mimetype || "").toLowerCase();
  const name = file.name || "";
  const ext = name.slice((name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();

  const allowedExts = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
  if (!ALLOWED_IMAGE_MIMES.has(mime) && !allowedExts.has(ext)) {
    return {
      valid: false,
      error: `Invalid image format '${mime || ext}'. Allowed: JPEG, PNG, WebP, AVIF. (SVG and executables are blocked for security).`,
    };
  }

  // 10 MB max
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "Image file exceeds maximum allowed size of 10 MB." };
  }

  return { valid: true };
};
