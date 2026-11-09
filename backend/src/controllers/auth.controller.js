import User from "../models/User.js";
import Tutor from "../models/Tutor.js";
import Alumno from "../models/Alumno.js";
import { signAuthToken } from "../utils/jwt.js";

const COOKIE_NAME = "token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

/**
 * POST /api/auth/login
 * Autenticación para Staff (admin, coordinador, entrenador) y Tutores
 * Payload: { email, password }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    // 1. Buscar en Staff (User)
    let entity = await User.findOne({ email: cleanEmail }).select("+password").populate("sedes");
    let tipo = "staff";

    // 2. Si no es staff, buscar en Tutores
    if (!entity) {
      entity = await Tutor.findOne({ email: cleanEmail })
        .select("+password")
        .populate("alumnos", "nombre apellido dni nivel activo aptoMedico");
      tipo = "tutor";
    }

    if (!entity) {
      console.warn(`[AUDIT] Login fallido (usuario no encontrado): ${cleanEmail}`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 3. Verificar estado
    if (entity.estado === "inactivo") {
      console.warn(`[AUDIT] Login rechazado (cuenta inactiva): ${cleanEmail}`);
      return res.status(403).json({ message: "La cuenta de usuario está inhabilitada" });
    }

    // 4. Validar contraseña
    const passwordMatch = await entity.comparePassword(password);
    if (!passwordMatch) {
      console.warn(`[AUDIT] Login fallido (contraseña incorrecta): ${cleanEmail}`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 5. Generar token y cookie
    const token = signAuthToken({
      _id: entity._id,
      rol: entity.rol,
      tipo,
    });

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    const userObj = entity.toJSON();
    return res.json({
      ok: true,
      user: {
        ...userObj,
        tipo,
      },
      token, // Devuelto también por conveniencia para clientes móviles/tests
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login-pin
 * Autenticación con PIN para Alumnos mayores habilitados
 * Payload: { dni, pin }
 */
export const loginPin = async (req, res, next) => {
  try {
    const { dni, pin } = req.body;
    const cleanDni = String(dni || "").trim();

    const alumno = await Alumno.findOne({ dni: cleanDni })
      .select("+pin")
      .populate("sede")
      .populate("tutorPrincipal", "nombre apellido email telefono");

    if (!alumno) {
      console.warn(`[AUDIT] Login PIN fallido (alumno no encontrado): DNI ${cleanDni}`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (!alumno.activo) {
      console.warn(`[AUDIT] Login PIN rechazado (alumno inactivo): DNI ${cleanDni}`);
      return res.status(403).json({ message: "La cuenta del alumno está inactiva" });
    }

    if (!alumno.accesoApp) {
      console.warn(`[AUDIT] Login PIN rechazado (sin accesoApp): DNI ${cleanDni}`);
      return res.status(403).json({ message: "El alumno no tiene acceso a la aplicación habilitado" });
    }

    const pinMatch = await alumno.comparePin(pin);
    if (!pinMatch) {
      console.warn(`[AUDIT] Login PIN fallido (PIN incorrecto): DNI ${cleanDni}`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = signAuthToken({
      _id: alumno._id,
      rol: "alumno",
      tipo: "alumno",
    });

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    const alumnoObj = alumno.toJSON();
    return res.json({
      ok: true,
      user: {
        ...alumnoObj,
        tipo: "alumno",
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Cierre de sesión y limpieza de cookies
 */
export const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ ok: true, message: "Sesión cerrada correctamente" });
};

/**
 * GET /api/auth/me
 * Devuelve el usuario actualmente autenticado
 */
export const me = async (req, res, next) => {
  try {
    const { _id, rol } = req.user;
    let fullUser = null;

    if (rol === "tutor") {
      fullUser = await Tutor.findById(_id).populate(
        "alumnos",
        "nombre apellido dni nivel activo aptoMedico sede"
      );
    } else if (rol === "alumno") {
      fullUser = await Alumno.findById(_id)
        .populate("sede")
        .populate("tutorPrincipal", "nombre apellido email telefono");
    } else {
      fullUser = await User.findById(_id).populate("sedes");
    }

    if (!fullUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userObj = fullUser.toJSON();
    return res.json({
      ok: true,
      user: {
        ...userObj,
        tipo: req.userType,
      },
    });
  } catch (err) {
    next(err);
  }
};
