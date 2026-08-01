import rateLimit from "express-rate-limit";

// Limit general API requests (e.g., fetching lists)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  message: { error: "Too many requests, please try again later." },
});

// Stricter limits for forms/submissions to prevent spam
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 submissions per hour
  message: { error: "Too many form submissions from this IP, please try again after an hour." },
});

// Specifically for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: { error: "Too many login attempts, please try again later." },
});
