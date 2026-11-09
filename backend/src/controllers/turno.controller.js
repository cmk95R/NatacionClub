import Turno from "../models/Turno.js";
import Horario from "../models/Horario.js";
import Reserva from "../models/Reserva.js";
import { generarTurnos, asegurarGrillaHorarios } from "../services/turnos.service.js";
import { sendEmail } from "../services/email.service.js";

// POST /api/admin/turnos/generar
export const generarTurnosController = async (req, res, next) => {
  try {
    const { horarioIds, sede, desde, hasta, grillaCompleta } = req.body;

    const resultado = await generarTurnos({
      horarioIds,
      sede,
      desde,
      hasta,
      grillaCompleta: grillaCompleta ?? true, // Por defecto true para asegurar 07:00 a 22:00
    });

    return res.status(201).json({
      ok: true,
      message: `Generación completada. Se crearon ${resultado.creados} turnos (${resultado.existentes} ya existían).`,
      resumen: {
        creados: resultado.creados,
        existentes: resultado.existentes,
        total: resultado.total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/turnos/grilla-horarios
// Crea plantillas de horarios de 07:00 a 22:00 lunes a domingo para la sede
export const poblarGrillaHorariosController = async (req, res, next) => {
  try {
    const { sedeId } = req.body;
    const creadas = await asegurarGrillaHorarios({ sedeId });
    return res.json({
      ok: true,
      message: `Se crearon ${creadas} plantillas de horarios (07:00 a 22:00 hs, Lunes a Domingo).`,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/turnos?desde&hasta&sede&nivel&estado
export const listTurnos = async (req, res, next) => {
  try {
    const { desde, hasta, sede, nivel, estado, horario } = req.query;
    const filter = {};

    // 1. Filtro por fecha
    if (desde && hasta) {
      filter.fecha = { $gte: String(desde), $lte: String(hasta) };
    } else if (desde) {
      filter.fecha = { $gte: String(desde) };
    } else if (hasta) {
      filter.fecha = { $lte: String(hasta) };
    }

    // 2. Filtro por estado
    if (estado) {
      filter.estado = estado;
    }

    // 3. Filtro por horario directo
    if (horario) {
      filter.horario = horario;
    }

    // 4. Filtro relacional por sede o nivel
    if (sede || nivel) {
      const horarioFilter = {};
      if (sede) horarioFilter.sede = sede;
      if (nivel) horarioFilter.nivel = nivel;
      const matchingHorarios = await Horario.find(horarioFilter).distinct("_id");
      filter.horario = { $in: matchingHorarios };
    }

    const turnos = await Turno.find(filter)
      .populate({
        path: "horario",
        populate: [
          { path: "sede", select: "nombre direccion" },
          { path: "pileta", select: "nombre carriles" },
          { path: "entrenador", select: "nombre apellido email" },
        ],
      })
      .sort({ fecha: 1, horaInicio: 1 })
      .lean();

    return res.json({ ok: true, turnos });
  } catch (err) {
    next(err);
  }
};

// GET /api/turnos/:id
export const getTurnoById = async (req, res, next) => {
  try {
    const turno = await Turno.findById(req.params.id)
      .populate({
        path: "horario",
        populate: [
          { path: "sede", select: "nombre direccion telefono" },
          { path: "pileta", select: "nombre carriles" },
          { path: "entrenador", select: "nombre apellido email telefono" },
        ],
      })
      .lean();

    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    return res.json({ ok: true, turno });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/turnos/:id/suspender
export const suspenderTurno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const turno = await Turno.findByIdAndUpdate(
      id,
      { estado: "suspendido" },
      { new: true }
    ).populate({
      path: "horario",
      populate: [{ path: "sede", select: "nombre" }],
    });

    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    // Notificar a los reservantes activos
    const reservasAfectadas = await Reserva.find({
      turno: id,
      estado: "confirmada",
    })
      .populate({
        path: "alumno",
        populate: { path: "tutorPrincipal", select: "email nombre" },
      })
      .lean();

    // Enviar emails de aviso a los tutores de los alumnos afectados
    for (const resItem of reservasAfectadas) {
      const tutorEmail = resItem.alumno?.tutorPrincipal?.email;
      if (tutorEmail) {
        sendEmail({
          to: tutorEmail,
          subject: "Aviso de turno suspendido",
          html: `
            <p>Estimado/a tutor/a:</p>
            <p>Le informamos que el turno del día <strong>${turno.fecha}</strong> a las <strong>${turno.horaInicio}</strong> para el alumno <strong>${resItem.alumno.nombre} ${resItem.alumno.apellido}</strong> en la sede <strong>${turno.horario?.sede?.nombre || ""}</strong> ha sido <strong>SUSPENDIDO</strong>.</p>
            ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ""}
            <p>Disculpe las molestias ocasionadas.</p>
          `,
        }).catch((err) => console.error("Error enviando email de turno suspendido:", err));
      }
    }

    return res.json({
      ok: true,
      message: "Turno suspendido correctamente",
      reservasAfectadas: reservasAfectadas.length,
      turno,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/turnos/:id o /api/turnos/:id
// Coordinador / Admin elimina definitivamente un turno
export const deleteTurno = async (req, res, next) => {
  try {
    const { id } = req.params;

    const turno = await Turno.findById(id).populate({
      path: "horario",
      populate: [{ path: "sede", select: "nombre" }],
    });

    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    // Cancelar reservas asociadas
    const reservasAfectadas = await Reserva.find({
      turno: id,
      estado: { $in: ["confirmada", "sujeto_confirmacion", "pendiente"] },
    }).populate({
      path: "alumno",
      populate: { path: "tutorPrincipal", select: "email nombre" },
    });

    for (const r of reservasAfectadas) {
      r.estado = "cancelada";
      r.motivoCancelacion = "Turno eliminado por la coordinación del club";
      await r.save();

      const tutorEmail = r.alumno?.tutorPrincipal?.email;
      if (tutorEmail) {
        sendEmail({
          to: tutorEmail,
          subject: "Turno Cancelado — Club de Natación",
          html: `<p>Estimado/a tutor/a: Le informamos que el turno del día <strong>${turno.fecha}</strong> a las <strong>${turno.horaInicio} hs</strong> ha sido eliminado por coordinación.</p>`,
        }).catch((err) => console.error("Error enviando email:", err));
      }
    }

    await Turno.findByIdAndDelete(id);

    return res.json({
      ok: true,
      message: "Turno eliminado exitosamente",
      reservasCanceladas: reservasAfectadas.length,
    });
  } catch (err) {
    next(err);
  }
};
