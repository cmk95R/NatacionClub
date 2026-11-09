import jwt from "jsonwebtoken";

/**
 * Genera un token JWT para un usuario, tutor o alumno.
 */
export function signAuthToken(entity, options = { expiresIn: "7d" }) {
  const payload = entity._id
    ? {
        id: entity._id.toString(),
        rol: entity.rol || "alumno",
        tipo: entity.tipo || (entity.rol === "tutor" ? "tutor" : entity.rol === "alumno" ? "alumno" : "staff"),
      }
    : entity;

  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

/**
 * Verifica un token JWT con el secreto del sistema.
 */
export function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export default {
  signAuthToken,
  verifyAuthToken,
};
