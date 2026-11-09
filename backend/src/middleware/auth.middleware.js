import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Tutor from "../models/Tutor.js";
import Alumno from "../models/Alumno.js";

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const entityId = payload.id || payload.sub;
    if (!entityId) {
      return res.status(401).json({ message: "Token inválido (sin id)" });
    }

    let entity = null;
    const rol = payload.rol;

    if (rol === "tutor") {
      entity = await Tutor.findById(entityId);
    } else if (rol === "alumno") {
      entity = await Alumno.findById(entityId);
    } else {
      entity = await User.findById(entityId);
    }

    // Fallback de búsqueda si no coincide el rol
    if (!entity) {
      entity =
        (await User.findById(entityId)) ||
        (await Tutor.findById(entityId)) ||
        (await Alumno.findById(entityId));
    }

    if (!entity) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    if (entity.estado === "inactivo" || entity.activo === false) {
      return res.status(403).json({ message: "La cuenta de usuario está deshabilitada." });
    }

    req.user = entity;
    req.userType = entity.rol === "tutor" ? "tutor" : entity.rol === "alumno" ? "alumno" : "staff";
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
