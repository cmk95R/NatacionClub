import Reserva from "../models/Reserva.js";
import Alumno from "../models/Alumno.js";
import Turno from "../models/Turno.js";
import Horario from "../models/Horario.js";
import User from "../models/User.js";
import { crearReserva, cancelarReserva, recalcularCupoOcupado } from "../services/cupo.service.js";
import { sendEmail } from "../services/email.service.js";

// POST /api/reservas
export const crearReservaController = async (req, res, next) => {
  try {
    const { alumnoId, turnoId } = req.body;
    const resultado = await crearReserva({
      alumnoId,
      turnoId,
      usuarioSolicitante: req.user,
    });

    return res.status(201).json({
      ok: true,
      message: resultado.mensaje,
      reserva: resultado.reserva,
      estado: resultado.estado,
      posicionEspera: resultado.posicionEspera,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reservas/:id
export const cancelarReservaController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const resultado = await cancelarReserva({
      reservaId: id,
      usuarioSolicitante: req.user,
      motivo,
    });

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
};

// GET /api/reservas/mias (Tutor o Alumno)
export const listMisReservas = async (req, res, next) => {
  try {
    const user = req.user;
    let filter = {};

    if (user.rol === "tutor") {
      const misAlumnos = await Alumno.find({
        $or: [{ tutorPrincipal: user._id }, { tutoresSecundarios: user._id }],
      }).distinct("_id");

      filter.alumno = { $in: misAlumnos };
    } else if (user.rol === "alumno") {
      filter.alumno = user._id;
    } else {
      // Staff puede consultar con filtro opcional de alumno
      if (req.query.alumnoId) {
        filter.alumno = req.query.alumnoId;
      }
    }

    if (req.query.estado) {
      filter.estado = req.query.estado;
    }

    const reservas = await Reserva.find(filter)
      .populate("alumno", "nombre apellido dni nivel aptoMedico")
      .populate("entrenador", "nombre apellido email telefono")
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

    return res.json({ ok: true, reservas });
  } catch (err) {
    next(err);
  }
};

// GET /api/reservas/turno/:id (Staff / Entrenador)
export const listReservasByTurno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const turno = await Turno.findById(id).populate("horario");

    if (!turno) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    const reservas = await Reserva.find({ turno: id })
      .populate({
        path: "alumno",
        select: "nombre apellido dni nivel aptoMedico telefono tutorPrincipal",
        populate: { path: "tutorPrincipal", select: "nombre apellido email telefono" },
      })
      .populate("entrenador", "nombre apellido email")
      .sort({ estado: 1, createdAt: 1 })
      .lean();

    return res.json({ ok: true, turno, reservas });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservas/disponibilidad
// Devuelve franjas horarias agrupadas por día/hora para una sede y ventana de fechas.
// Soporta filtro por franja del día: mañana, tarde, noche.
// ─────────────────────────────────────────────────────────────────────────────
export const getDisponibilidad = async (req, res, next) => {
  try {
    const { sede, nivel, desde, hasta, turno: turnoDelDia } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ message: "Parámetros 'desde' y 'hasta' son obligatorios (YYYY-MM-DD)" });
    }

    // Buscar turnos programados en el rango de fechas
    const turnoFilter = {
      fecha: { $gte: desde, $lte: hasta },
      estado: "programado",
    };

    // Filtro por sede y/o nivel (relacional via Horario)
    if (sede || nivel) {
      const horarioFilter = {};
      if (sede) horarioFilter.sede = sede;
      if (nivel) horarioFilter.nivel = nivel;
      const matchingHorarios = await Horario.find(horarioFilter).distinct("_id");
      turnoFilter.horario = { $in: matchingHorarios };
    }

    // Filtro por turno del día (mañana/tarde/noche) aplicado sobre horaInicio
    if (turnoDelDia && turnoDelDia !== "todos") {
      const rangos = {
        mañana: { $gte: "07:00", $lt: "12:00" },
        manana: { $gte: "07:00", $lt: "12:00" },
        tarde: { $gte: "12:00", $lt: "18:00" },
        noche: { $gte: "18:00", $lte: "22:00" },
      };
      const rango = rangos[turnoDelDia.toLowerCase()];
      if (rango) {
        turnoFilter.horaInicio = rango;
      }
    }

    const turnos = await Turno.find(turnoFilter)
      .populate({
        path: "horario",
        populate: [
          { path: "sede", select: "nombre direccion" },
          { path: "pileta", select: "nombre" },
        ],
      })
      .sort({ fecha: 1, horaInicio: 1 })
      .lean();

    // Agrupar por (sede, fecha, horaInicio, nivel) → franja
    const franjaMap = new Map();

    for (const turno of turnos) {
      const h = turno.horario;
      if (!h) continue;

      const sedeId = h.sede?._id?.toString() || "";
      const sedeNombre = h.sede?.nombre || "Sede";
      const nivelTurno = h.nivel;

      // Calcular hora de fin
      const [hh, mm] = turno.horaInicio.split(":").map(Number);
      const totalMin = hh * 60 + mm + (h.duracionMin || 60);
      const horaFin = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

      // Clave única de franja: sede + fecha + horaInicio + nivel
      const key = `${sedeId}|${turno.fecha}|${turno.horaInicio}|${nivelTurno}`;

      if (!franjaMap.has(key)) {
        let franjaDelDia = "noche";
        if (hh < 12) franjaDelDia = "mañana";
        else if (hh < 18) franjaDelDia = "tarde";

        franjaMap.set(key, {
          key,
          sedeId,
          sedeNombre,
          fecha: turno.fecha,
          diaSemana: h.diaSemana,
          horaInicio: turno.horaInicio,
          horaFin,
          nivel: nivelTurno,
          franjaDelDia,
          turnosIds: [],
          cupoTotal: 0,
          cupoOcupado: 0,
          sujetosConfirmacion: 0,
        });
      }

      const franja = franjaMap.get(key);
      franja.turnosIds.push(turno._id.toString());
      franja.cupoTotal += turno.cupoMax;
      franja.cupoOcupado += turno.cupoOcupado;

      // Contar solicitudes sujeto_confirmacion
      const sujetos = await Reserva.countDocuments({
        turno: turno._id,
        estado: "sujeto_confirmacion",
      });
      franja.sujetosConfirmacion += sujetos;
    }

    // Convertir mapa a array y calcular lugares libres
    const franjas = Array.from(franjaMap.values()).map((f) => ({
      ...f,
      lugaresLibres: Math.max(0, f.cupoTotal - f.cupoOcupado),
      disponible: f.cupoTotal - f.cupoOcupado > 0,
    }));

    return res.json({ ok: true, franjas });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservas/admin/pendientes
// Lista reservas en estado "sujeto_confirmacion" para que coordinación las apruebe/asigne.
// ─────────────────────────────────────────────────────────────────────────────
export const listReservasPendientesConfirmacion = async (req, res, next) => {
  try {
    const { sede } = req.query;
    let filter = { estado: "sujeto_confirmacion" };

    if (sede) {
      const horarios = await Horario.find({ sede }).distinct("_id");
      const turnos = await Turno.find({ horario: { $in: horarios } }).distinct("_id");
      filter.turno = { $in: turnos };
    }

    const reservas = await Reserva.find(filter)
      .populate({
        path: "alumno",
        select: "nombre apellido dni nivel aptoMedico",
        populate: { path: "tutorPrincipal", select: "nombre apellido email telefono" },
      })
      .populate("entrenador", "nombre apellido email")
      .populate({
        path: "turno",
        populate: {
          path: "horario",
          populate: [
            { path: "sede", select: "nombre" },
            { path: "pileta", select: "nombre" },
            { path: "entrenador", select: "nombre apellido" },
          ],
        },
      })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ ok: true, reservas });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/reservas/admin/:id/confirmar
// Aprueba o rechaza una reserva sujeta a confirmación (coordinador / admin).
// ─────────────────────────────────────────────────────────────────────────────
export const confirmarReservaController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accion, motivo, entrenadorId } = req.body; // accion: "aprobar" | "rechazar"

    const reserva = await Reserva.findById(id)
      .populate("alumno")
      .populate({ path: "turno", populate: { path: "horario", populate: { path: "sede" } } });

    if (!reserva) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    if (reserva.estado !== "sujeto_confirmacion") {
      return res.status(400).json({ message: `La reserva ya fue procesada (estado: ${reserva.estado})` });
    }

    if (accion === "rechazar") {
      reserva.estado = "cancelada";
      reserva.motivoCancelacion = motivo || "Solicitud rechazada por coordinación";
      await reserva.save();

      return res.json({
        ok: true,
        message: "Solicitud rechazada. La reserva fue cancelada.",
        reserva,
      });
    }

    // Acción: "aprobar"
    const turno = reserva.turno;
    const cupoActual = await Reserva.countDocuments({ turno: turno._id, estado: "confirmada" });

    if (cupoActual >= turno.cupoMax) {
      reserva.estado = "pendiente";
      await reserva.save();

      return res.json({
        ok: true,
        message: "Solicitud aprobada pero el turno ya está completo. El alumno fue ingresado a la lista de espera.",
        reserva,
      });
    }

    if (entrenadorId) {
      reserva.entrenador = entrenadorId;
    }

    reserva.estado = "confirmada";
    await reserva.save();
    await recalcularCupoOcupado(turno._id);

    // Notificar al tutor si existe
    const tutorEmail = reserva.alumno?.tutorPrincipal?.email;
    if (tutorEmail) {
      sendEmail({
        to: tutorEmail,
        subject: "✅ Reserva Confirmada — Club de Natación",
        html: `
          <p>Estimado/a tutor/a:</p>
          <p>Nos complace confirmarle que la solicitud de clase para <strong>${reserva.alumno.nombre} ${reserva.alumno.apellido}</strong> fue <strong>aprobada</strong> por el equipo de coordinación.</p>
          <ul>
            <li><strong>Fecha:</strong> ${turno.fecha}</li>
            <li><strong>Horario:</strong> ${turno.horaInicio} hs</li>
            <li><strong>Sede:</strong> ${turno.horario?.sede?.nombre || "Sede"}</li>
            <li><strong>Nivel:</strong> ${turno.nivel || turno.horario?.nivel || ""}</li>
          </ul>
          <p>¡Los esperamos!</p>
        `,
      }).catch((err) => console.error("Error enviando email de confirmación:", err));
    }

    return res.json({
      ok: true,
      message: "Reserva confirmada exitosamente.",
      reserva,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/reservas/:id/tomar
// El entrenador toma un turno disponible (sujeto_confirmacion) → pasa a confirmada
// ─────────────────────────────────────────────────────────────────────────────
export const tomarReservaController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entrenadorId = req.user._id;

    const reserva = await Reserva.findById(id)
      .populate("alumno")
      .populate({ path: "turno", populate: { path: "horario", populate: { path: "sede" } } });

    if (!reserva) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    if (reserva.estado !== "sujeto_confirmacion") {
      return res.status(400).json({
        message: `Solo se pueden tomar reservas en estado 'sujeto_confirmacion'. Estado actual: ${reserva.estado}`,
      });
    }

    if (reserva.entrenador) {
      return res.status(400).json({
        message: "Esta reserva ya tiene un profesor asignado",
      });
    }

    const turno = reserva.turno;
    const cupoActual = await Reserva.countDocuments({ turno: turno._id, estado: "confirmada" });

    if (cupoActual >= turno.cupoMax) {
      return res.status(400).json({ message: "El turno ya está completo, no es posible tomar esta reserva" });
    }

    reserva.entrenador = entrenadorId;
    reserva.estado = "confirmada";
    await reserva.save();

    await recalcularCupoOcupado(turno._id);

    // Notificar al tutor si existe
    const tutorEmail = reserva.alumno?.tutorPrincipal?.email;
    if (tutorEmail) {
      sendEmail({
        to: tutorEmail,
        subject: "✅ Clase Confirmada — Club de Natación",
        html: `
          <p>Estimado/a tutor/a:</p>
          <p>Un profesor ha tomado la clase de <strong>${reserva.alumno.nombre} ${reserva.alumno.apellido}</strong>. ¡La reserva está <strong>confirmada</strong>!</p>
          <ul>
            <li><strong>Fecha:</strong> ${turno.fecha}</li>
            <li><strong>Horario:</strong> ${turno.horaInicio} hs</li>
            <li><strong>Sede:</strong> ${turno.horario?.sede?.nombre || "Sede"}</li>
          </ul>
          <p>¡Los esperamos!</p>
        `,
      }).catch((err) => console.error("Error enviando email:", err));
    }

    const populated = await Reserva.findById(reserva._id)
      .populate("alumno", "nombre apellido dni nivel")
      .populate("entrenador", "nombre apellido")
      .populate({ path: "turno", populate: { path: "horario", populate: { path: "sede", select: "nombre" } } })
      .lean();

    return res.json({
      ok: true,
      message: "¡Turno tomado exitosamente! La clase ha sido confirmada para el alumno.",
      reserva: populated,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/reservas/admin/:id/asignar-entrenador
// Coordinador/admin asigna manualmente un entrenador a una reserva
// ─────────────────────────────────────────────────────────────────────────────
export const asignarEntrenadorController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entrenadorId } = req.body;

    if (!entrenadorId) {
      return res.status(400).json({ message: "El campo 'entrenadorId' es obligatorio" });
    }

    const entrenador = await User.findById(entrenadorId);
    if (!entrenador || !["entrenador", "coordinador", "admin"].includes(entrenador.rol)) {
      return res.status(400).json({ message: "El usuario seleccionado no es un entrenador válido" });
    }

    const reserva = await Reserva.findById(id)
      .populate("alumno")
      .populate({ path: "turno", populate: { path: "horario", populate: { path: "sede" } } });

    if (!reserva) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    const turno = reserva.turno;

    // Si aún estaba sujeto a confirmación, verificar cupo y confirmar
    if (reserva.estado === "sujeto_confirmacion") {
      const cupoActual = await Reserva.countDocuments({ turno: turno._id, estado: "confirmada" });
      if (cupoActual >= turno.cupoMax) {
        return res.status(400).json({ message: "El turno está completo. No hay cupo disponible." });
      }
      reserva.estado = "confirmada";
    }

    reserva.entrenador = entrenadorId;
    await reserva.save();

    await recalcularCupoOcupado(turno._id);

    // Notificar al tutor
    const tutorEmail = reserva.alumno?.tutorPrincipal?.email;
    if (tutorEmail) {
      sendEmail({
        to: tutorEmail,
        subject: "✅ Profesor Asignado — Club de Natación",
        html: `
          <p>Estimado/a tutor/a:</p>
          <p>Se ha asignado al profesor <strong>${entrenador.nombre} ${entrenador.apellido}</strong> para la clase de <strong>${reserva.alumno.nombre} ${reserva.alumno.apellido}</strong>.</p>
          <ul>
            <li><strong>Fecha:</strong> ${turno.fecha}</li>
            <li><strong>Horario:</strong> ${turno.horaInicio} hs</li>
            <li><strong>Sede:</strong> ${turno.horario?.sede?.nombre || "Sede"}</li>
          </ul>
        `,
      }).catch((err) => console.error("Error enviando email:", err));
    }

    const populated = await Reserva.findById(reserva._id)
      .populate("alumno", "nombre apellido dni nivel")
      .populate("entrenador", "nombre apellido")
      .populate({ path: "turno", populate: { path: "horario", populate: { path: "sede", select: "nombre" } } })
      .lean();

    return res.json({
      ok: true,
      message: `Profesor ${entrenador.nombre} ${entrenador.apellido} asignado exitosamente.`,
      reserva: populated,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservas/entrenador/disponibles
// El entrenador consulta solicitudes en "sujeto_confirmacion" sin profe asignado
// ─────────────────────────────────────────────────────────────────────────────
export const listDisponiblesParaEntrenador = async (req, res, next) => {
  try {
    const { sede, fecha, nivel } = req.query;

    let filter = {
      estado: "sujeto_confirmacion",
      entrenador: null,
    };

    if (sede || nivel || fecha) {
      const horarioFilter = {};
      if (sede) horarioFilter.sede = sede;
      if (nivel) horarioFilter.nivel = nivel;

      const horarios = await Horario.find(horarioFilter).distinct("_id");
      const turnoFilter = { horario: { $in: horarios } };

      const hoy = new Date().toISOString().split("T")[0];
      if (fecha) {
        turnoFilter.fecha = fecha;
      } else {
        turnoFilter.fecha = { $gte: hoy };
      }

      const turnos = await Turno.find(turnoFilter).distinct("_id");
      filter.turno = { $in: turnos };
    } else {
      const hoy = new Date().toISOString().split("T")[0];
      const turnosFuturos = await Turno.find({ fecha: { $gte: hoy }, estado: "programado" }).distinct("_id");
      filter.turno = { $in: turnosFuturos };
    }

    const reservas = await Reserva.find(filter)
      .populate({
        path: "alumno",
        select: "nombre apellido dni nivel aptoMedico",
        populate: { path: "tutorPrincipal", select: "nombre apellido telefono email" },
      })
      .populate({
        path: "turno",
        populate: {
          path: "horario",
          populate: [
            { path: "sede", select: "nombre direccion" },
            { path: "pileta", select: "nombre" },
          ],
        },
      })
      .sort({ "turno.fecha": 1, createdAt: 1 })
      .lean();

    return res.json({ ok: true, reservas });
  } catch (err) {
    next(err);
  }
};
