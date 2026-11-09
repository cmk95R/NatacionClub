import dayjs from "dayjs";
import Turno from "../models/Turno.js";
import Alumno from "../models/Alumno.js";
import Reserva from "../models/Reserva.js";
import Config from "../models/Config.js";
import { canAccessAlumno } from "../utils/ownership.js";
import { sendEmail } from "./email.service.js";

/**
 * Recalcula de manera determinística el cupo ocupado de un turno a partir de sus reservas confirmadas.
 */
export async function recalcularCupoOcupado(turnoId) {
  const count = await Reserva.countDocuments({
    turno: turnoId,
    estado: "confirmada",
  });

  await Turno.findByIdAndUpdate(turnoId, { cupoOcupado: count });
  return count;
}

/**
 * Promueve automáticamente al primer alumno en lista de espera al liberarse un cupo.
 */
export async function promoverSiguienteEnEspera(turnoId, cupoMax) {
  const confirmadas = await Reserva.countDocuments({
    turno: turnoId,
    estado: "confirmada",
  });

  if (confirmadas >= cupoMax) {
    return null;
  }

  const siguiente = await Reserva.findOne({
    turno: turnoId,
    estado: "pendiente",
  })
    .sort({ createdAt: 1 })
    .populate({
      path: "alumno",
      populate: { path: "tutorPrincipal", select: "email nombre" },
    });

  if (!siguiente) {
    return null;
  }

  siguiente.estado = "confirmada";
  await siguiente.save();

  await recalcularCupoOcupado(turnoId);

  // Notificar por correo la obtención de cupo
  const tutorEmail = siguiente.alumno?.tutorPrincipal?.email;
  if (tutorEmail) {
    const turnoDoc = await Turno.findById(turnoId).populate({
      path: "horario",
      populate: { path: "sede", select: "nombre" },
    });

    sendEmail({
      to: tutorEmail,
      subject: "Cupo confirmado desde lista de espera",
      html: `
        <p>Estimado/a tutor/a:</p>
        <p>Le informamos que se ha liberado un lugar y se confirmó la reserva para <strong>${siguiente.alumno.nombre} ${siguiente.alumno.apellido}</strong> en el turno del día <strong>${turnoDoc?.fecha}</strong> a las <strong>${turnoDoc?.horaInicio}</strong> (${turnoDoc?.horario?.sede?.nombre || "Sede central"}).</p>
      `,
    }).catch((err) => console.error("Error enviando email de promoción:", err));
  }

  return siguiente;
}

/**
 * Flujo completo y validación atómica para crear una reserva o ingresar a lista de espera.
 */
export async function crearReserva({ alumnoId, turnoId, usuarioSolicitante }) {
  // 1. Obtener Alumno
  const alumno = await Alumno.findById(alumnoId);
  if (!alumno) {
    throw new Error("Alumno no encontrado");
  }

  if (!alumno.activo) {
    throw new Error("El alumno se encuentra inactivo");
  }

  // 2. Validar ownership
  if (!canAccessAlumno(usuarioSolicitante, alumno)) {
    throw new Error("No tiene autorización para realizar reservas para este alumno");
  }

  // 3. Obtener Turno con Horario
  const turno = await Turno.findById(turnoId).populate("horario");
  if (!turno) {
    throw new Error("Turno no encontrado");
  }

  if (turno.estado !== "programado") {
    throw new Error(`No se puede reservar un turno en estado '${turno.estado}'`);
  }

  // Determinar si es staff (se usa en múltiples validaciones)
  const isStaff = ["admin", "coordinador"].includes(usuarioSolicitante.rol);

  // 4. Validar Feature Flags en Config
  const flagReservas = await Config.findOne({ key: "reservas_abiertas" }).lean();
  if (flagReservas && flagReservas.value === false && !isStaff) {
    throw new Error("El sistema de reservas se encuentra temporalmente cerrado");
  }

  // Ventana de reserva
  const flagVentana = await Config.findOne({ key: "ventana_reserva_dias" }).lean();
  const maxDiasVentana = Number(flagVentana?.value) || 30;

  const hoy = dayjs().startOf("day");
  const fechaTurno = dayjs(turno.fecha).startOf("day");

  if (fechaTurno.isBefore(hoy) && !isStaff) {
    throw new Error("No se pueden reservar turnos para fechas pasadas");
  }

  if (fechaTurno.diff(hoy, "day") > maxDiasVentana && !isStaff) {
    throw new Error(`Solo se permiten reservas con hasta ${maxDiasVentana} días de anticipación`);
  }

  // Validación de apto médico si la regla está configurada
  const flagApto = await Config.findOne({ key: "apto_medico_requerido" }).lean();
  if (flagApto && flagApto.value === true && !isStaff) {
    if (!alumno.aptoMedico?.vence || dayjs(alumno.aptoMedico.vence).isBefore(fechaTurno)) {
      throw new Error("El alumno no cuenta con certificado de apto médico vigente para la fecha del turno");
    }
  }

  // 5. Validar compatibilidad de nivel
  if (!isStaff && turno.horario && alumno.nivel !== turno.horario.nivel) {
    throw new Error(
      `El nivel del alumno (${alumno.nivel}) no coincide con el nivel requerido para este turno (${turno.horario.nivel})`
    );
  }

  // 6. Verificar si el alumno ya tiene una reserva activa en este turno
  const reservaExistente = await Reserva.findOne({
    alumno: alumnoId,
    turno: turnoId,
    estado: { $in: ["sujeto_confirmacion", "confirmada", "pendiente"] },
  });

  if (reservaExistente) {
    const msgMap = {
      confirmada: "El alumno ya posee una reserva confirmada en este turno",
      pendiente: "El alumno ya se encuentra en lista de espera para este turno",
      sujeto_confirmacion: "El alumno ya tiene una solicitud pendiente de confirmación para este turno",
    };
    throw new Error(msgMap[reservaExistente.estado] || "El alumno ya tiene una reserva en este turno");
  }

  // 7. Verificar superposición horaria en la misma fecha
  const turnosMismoHorario = await Turno.find({
    fecha: turno.fecha,
    horaInicio: turno.horaInicio,
    _id: { $ne: turno._id },
  }).distinct("_id");

  if (turnosMismoHorario.length > 0) {
    const reservaSuperpuesta = await Reserva.findOne({
      alumno: alumnoId,
      turno: { $in: turnosMismoHorario },
      estado: { $in: ["confirmada", "sujeto_confirmacion"] },
    });

    if (reservaSuperpuesta) {
      throw new Error("El alumno ya posee otra reserva confirmada o pendiente en el mismo día y horario");
    }
  }

  // 8. Determinar estado según rol del solicitante:
  //    Tutores y alumnos → "sujeto_confirmacion" (coordinación debe aprobar)
  //    Staff             → confirma/pone en espera directamente
  const tipoCreador =
    usuarioSolicitante.rol === "tutor"
      ? "tutor"
      : usuarioSolicitante.rol === "alumno"
      ? "alumno"
      : "staff";

  let estadoInicial;
  if (isStaff) {
    const cupoActual = await Reserva.countDocuments({ turno: turnoId, estado: "confirmada" });
    estadoInicial = cupoActual < turno.cupoMax ? "confirmada" : "pendiente";
  } else {
    estadoInicial = "sujeto_confirmacion";
  }

  // 9. Crear Reserva
  const reserva = await Reserva.create({
    alumno: alumnoId,
    turno: turnoId,
    estado: estadoInicial,
    creadaPor: {
      tipo: tipoCreador,
      ref: usuarioSolicitante._id,
    },
  });

  if (estadoInicial === "confirmada") {
    await recalcularCupoOcupado(turnoId);
  }

  let posicionEspera = null;
  if (estadoInicial === "pendiente") {
    posicionEspera = await Reserva.countDocuments({
      turno: turnoId,
      estado: "pendiente",
      createdAt: { $lte: reserva.createdAt },
    });
  }

  const populated = await Reserva.findById(reserva._id)
    .populate("alumno", "nombre apellido dni nivel")
    .populate({
      path: "turno",
      populate: {
        path: "horario",
        populate: [
          { path: "sede", select: "nombre direccion" },
          { path: "pileta", select: "nombre carriles" },
        ],
      },
    })
    .lean();

  const mensajeMap = {
    confirmada: "Reserva confirmada con éxito",
    pendiente: `Turno completo. Quedaste en el puesto ${posicionEspera} de la lista de espera`,
    sujeto_confirmacion:
      "Tu solicitud fue registrada y está sujeta a confirmación por el equipo de coordinación. Te notificaremos cuando sea aprobada.",
  };

  return {
    reserva: populated,
    estado: estadoInicial,
    posicionEspera,
    mensaje: mensajeMap[estadoInicial],
  };
}

/**
 * Cancelación de reserva con liberación de cupo y promoción automática de lista de espera.
 */
export async function cancelarReserva({ reservaId, usuarioSolicitante, motivo }) {
  const reserva = await Reserva.findById(reservaId).populate("alumno").populate("turno");

  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }

  if (!canAccessAlumno(usuarioSolicitante, reserva.alumno)) {
    throw new Error("No tiene autorización para cancelar esta reserva");
  }

  // Permitir cancelar también las solicitudes en sujeto_confirmacion
  const estadosCancelables = ["confirmada", "pendiente", "sujeto_confirmacion"];
  if (!estadosCancelables.includes(reserva.estado)) {
    throw new Error(`No se puede cancelar una reserva en estado '${reserva.estado}'`);
  }

  const isStaff = ["admin", "coordinador"].includes(usuarioSolicitante.rol);

  // Validación de plazo límite de cancelación (ej. hasta 2 horas antes del turno)
  // No aplica a sujeto_confirmacion porque aún no está confirmada
  if (!isStaff && reserva.turno && reserva.estado !== "sujeto_confirmacion") {
    const flagHoras = await Config.findOne({ key: "cancelacion_anticipacion_horas" }).lean();
    const horasMinimas = Number(flagHoras?.value) || 2;

    const fechaHoraTurno = dayjs(`${reserva.turno.fecha} ${reserva.turno.horaInicio}`);
    const ahora = dayjs();

    if (fechaHoraTurno.diff(ahora, "hour", true) < horasMinimas) {
      throw new Error(`Las cancelaciones solo se permiten hasta ${horasMinimas} horas antes del turno`);
    }
  }

  const estadoPrevio = reserva.estado;
  reserva.estado = "cancelada";
  reserva.motivoCancelacion = motivo ? String(motivo).trim() : "Cancelada por el usuario";
  await reserva.save();

  let promovido = null;
  if (estadoPrevio === "confirmada" && reserva.turno) {
    await recalcularCupoOcupado(reserva.turno._id);
    promovido = await promoverSiguienteEnEspera(reserva.turno._id, reserva.turno.cupoMax);
  }

  return {
    ok: true,
    message: "Reserva cancelada correctamente",
    reserva,
    promovido,
  };
}

export default {
  recalcularCupoOcupado,
  promoverSiguienteEnEspera,
  crearReserva,
  cancelarReserva,
};
