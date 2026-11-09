import { Router } from "express";
import { body } from "express-validator";
import { login, loginPin, logout, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Validaciones de login estándar (Staff y Tutor)
const loginValidations = [
  body("email")
    .isEmail()
    .withMessage("Debe proporcionar un email válido")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria"),
];

// Validaciones de login con PIN (Alumno)
const loginPinValidations = [
  body("dni")
    .trim()
    .notEmpty()
    .withMessage("El DNI es obligatorio")
    .matches(/^\d+$/)
    .withMessage("El DNI debe ser numérico"),
  body("pin")
    .trim()
    .notEmpty()
    .withMessage("El PIN es obligatorio")
    .matches(/^\d{4,6}$/)
    .withMessage("El PIN debe tener entre 4 y 6 dígitos numéricos"),
];

// POST /api/auth/login - Email + Password
router.post("/login", authLimiter, loginValidations, validateRequest, login);

// POST /api/auth/login-pin - DNI + PIN
router.post("/login-pin", authLimiter, loginPinValidations, validateRequest, loginPin);

// POST /api/auth/logout - Cierra sesión y borra cookie
router.post("/logout", logout);

// GET /api/auth/me - Perfil del usuario actual
router.get("/me", requireAuth, me);

export default router;
