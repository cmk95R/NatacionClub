import rateLimit from "express-rate-limit";

// Rate limit general para la API (más permisivo en desarrollo)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 300 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas peticiones desde esta IP, por favor intente más tarde." },
});

// Rate limit estricto para autenticación (5 intentos / 15 min en producción)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 5 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de acceso fallidos. Intente de nuevo en 15 minutos." },
});

