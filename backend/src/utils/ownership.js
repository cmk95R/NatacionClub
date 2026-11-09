/**
 * Comprueba si un usuario tiene permiso para acceder a los datos de un alumno
 * @param {Object} user - Usuario autenticado (de req.user)
 * @param {Object} alumno - Documento de alumno
 * @returns {boolean}
 */
export const canAccessAlumno = (user, alumno) => {
  if (!user || !alumno) return false;

  // Staff (admin, coordinador, entrenador)
  if (["admin", "coordinador", "entrenador"].includes(user.rol)) {
    return true;
  }

  // Alumno mayor con acceso propio
  if (user.rol === "alumno") {
    return user._id.toString() === alumno._id.toString();
  }

  // Tutor del alumno
  if (user.rol === "tutor") {
    const tutorId = user._id.toString();
    const isPrincipal =
      alumno.tutorPrincipal &&
      (alumno.tutorPrincipal._id || alumno.tutorPrincipal).toString() === tutorId;
    const isSecundario =
      Array.isArray(alumno.tutoresSecundarios) &&
      alumno.tutoresSecundarios.some(
        (t) => (t._id || t).toString() === tutorId
      );

    return Boolean(isPrincipal || isSecundario);
  }

  return false;
};

export default {
  canAccessAlumno,
};

