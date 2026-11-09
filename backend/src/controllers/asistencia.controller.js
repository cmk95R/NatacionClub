import Asistencia from "../models/Asistencia.js";
import Turno from "../models/Turno.js";
import Alumno from "../models/Alumno.js";
import Reserva from "../models/Reserva.js";
import { canAccessAlumno } from "../utils/ownership.js";

// Helper para verificar si el usuario puede registrar asistencia en el turno
const canManageTurnoAttendance = (user, turno) => {
  if (["admin", "coordinador"].includes(user.rol)) return true;
  if (user.rol === "entrenador") {
    const coachId = turno.horario?.entrenador?.toString();
    return Boolean(coachId && coachId === user._id.toString());
  }
  return false;
};

// GET /api/asistencia/turno/:turnoId (Entrenador / Staff)
export const getAsistenciaByTurno = async (req, res, next) => {
  try {
    const { turnoId } = req.params;
    const turno = await Turno.findById(turnoId).populate({
      path: "horario",
      populate: [
        { path: "sede", select: "nombre direccion" },
        { path: "pileta", select: "nombre carriles" },
      ],
    });

    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    if (!canManageTurnoAttendance(req.user, turno)) {
      return res.status(403).json({
        message: "No tiene permiso para ver la asistencia de este turno",
      });
    }

    // 1. Obtener registros de asistencia ya cargados
    const asistencias = await Asistencia.find({ turno: turnoId })
      .populate("alumno", "nombre apellido dni nivel")
      .populate("registradoPor", "nombre apellido")
      .lean();

    // 2. Obtener todas las reservas confirmadas del turno
    const reservas = await Reserva.find({
      turno: turnoId,
      estado: { $in: ["confirmada", "asistio", "ausente", "recupero"] },
    })
      .populate("alumno", "nombre apellido dni nivel aptoMedico")
      .lean();

    return res.json({
      ok: true,
      turno,
      asistencias,
      reservas,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/asistencia/turno/:turnoId (Registro masivo de asistencia)
export const registrarAsistenciaTurno = async (req, res, next) => {
  try {
    const { turnoId } = req.params;
    const { asistencias, finalizarTurno } = req.body;

    const turno = await Turno.findById(turnoId).populate("horario");
    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    if (!canManageTurnoAttendance(req.user, turno)) {
      return res.status(403).json({
        message: "No tiene permiso para registrar asistencia en este turno",
      });
    }

    const resultados = [];

    if (Array.isArray(asistencias)) {
      for (const item of asistencias) {
        if (!item.alumnoId || !item.estado) continue;

        // Upsert de Asistencia
        const asisDoc = await Asistencia.findOneAndUpdate(
          { turno: turnoId, alumno: item.alumnoId },
          {
            estado: item.estado,
            nota: item.nota ? String(item.nota).trim() : "",
            registradoPor: req.user._id,
          },
          { upsert: true, new: true, runValidators: true }
        );

        // Sincronizar estado en la Reserva correspondiente
        let estadoReserva = "confirmada";
        if (item.estado === "presente") estadoReserva = "asistio";
        else if (item.estado === "ausente") estadoReserva = "ausente";
        else if (item.estado === "recupero") estadoReserva = "recupero";

        await Reserva.findOneAndUpdate(
          { turno: turnoId, alumno: item.alumnoId },
          { estado: estadoReserva }
        );

        resultados.push(asisDoc);
      }
    }

    // Si se indicó finalizar el turno
    if (finalizarTurno) {
      turno.estado = "finalizado";
      await turno.save();

      // Alumnos con reserva confirmada que no tuvieron asistencia registrada se marcan ausentes
      const reservasPendientes = await Reserva.find({
        turno: turnoId,
        estado: "confirmada",
      });

      for (const r of reservasPendientes) {
        await Asistencia.findOneAndUpdate(
          { turno: turnoId, alumno: r.alumno },
          {
            estado: "ausente",
            nota: "Ausente por cierre automático de turno",
            registradoPor: req.user._id,
          },
          { upsert: true }
        );
        r.estado = "ausente";
        await r.save();
      }
    }

    return res.json({
      ok: true,
      message: finalizarTurno
        ? "Asistencia registrada y turno finalizado correctamente"
        : "Asistencia registrada correctamente",
      procesados: resultados.length,
      turno,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/asistencia/:id (Edición individual)
export const updateAsistencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, nota } = req.body;

    const asistencia = await Asistencia.findById(id).populate({
      path: "turno",
      populate: { path: "horario" },
    });

    if (!asistencia) {
      return res.status(404).json({ message: "Registro de asistencia no encontrado" });
    }

    if (!canManageTurnoAttendance(req.user, asistencia.turno)) {
      return res.status(403).json({
        message: "No tiene permiso para modificar este registro de asistencia",
      });
    }

    if (estado !== undefined) asistencia.estado = estado;
    if (nota !== undefined) asistencia.nota = String(nota).trim();
    asistencia.registradoPor = req.user._id;

    await asistencia.save();

    // Sincronizar estado en Reserva
    if (estado) {
      let estadoReserva = "confirmada";
      if (estado === "presente") estadoReserva = "asistio";
      else if (estado === "ausente") estadoReserva = "ausente";
      else if (estado === "recupero") estadoReserva = "recupero";

      await Reserva.findOneAndUpdate(
        { turno: asistencia.turno._id, alumno: asistencia.alumno },
        { estado: estadoReserva }
      );
    }

    return res.json({
      ok: true,
      message: "Registro de asistencia actualizado",
      asistencia,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/asistencia/alumno/:alumnoId (Tutor / Alumno / Staff)
export const getAsistenciaByAlumno = async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const alumno = await Alumno.findById(alumnoId);

    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    if (!canAccessAlumno(req.user, alumno)) {
      return res.status(403).json({
        message: "No tiene autorización para consultar la asistencia de este alumno",
      });
    }

    const asistencias = await Asistencia.find({ alumno: alumnoId })
      .populate({
        path: "turno",
        populate: {
          path: "horario",
          populate: [
            { path: "sede", select: "nombre direccion" },
            { path: "pileta", select: "nombre carriles" },
            { path: "entrenador", select: "nombre apellido" },
          ],
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      alumno: {
        _id: alumno._id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        dni: alumno.dni,
      },
      asistencias,
    });
  } catch (err) {
    next(err);
  }
};

