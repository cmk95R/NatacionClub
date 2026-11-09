import dayjs from "dayjs";
import Horario from "../models/Horario.js";
import Turno from "../models/Turno.js";
import Sede from "../models/Sede.js";
import Pileta from "../models/Pileta.js";

const DIAS_MAP = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};

export const HORAS_GRILLA = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00"
];

export const DIAS_SEMANA_COMPLETA = [
  "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"
];

/**
 * Asegura la existencia de plantillas de horarios de 07:00 a 22:00 para toda la semana.
 */
export async function asegurarGrillaHorarios({ sedeId } = {}) {
  const sedeFilter = { activa: true };
  if (sedeId) sedeFilter._id = sedeId;

  const sedes = await Sede.find(sedeFilter);
  let creadas = 0;

  for (const s of sedes) {
    const pileta = await Pileta.findOne({ sede: s._id, activa: true });
    if (!pileta) continue;

    for (const dia of DIAS_SEMANA_COMPLETA) {
      for (const hora of HORAS_GRILLA) {
        const existe = await Horario.findOne({
          sede: s._id,
          diaSemana: dia,
          horaInicio: hora,
        });

        if (!existe) {
          await Horario.create({
            sede: s._id,
            pileta: pileta._id,
            carril: 1,
            diaSemana: dia,
            horaInicio: hora,
            duracionMin: 60,
            cupoMax: pileta.carriles || 6,
            nivel: "iniciacion",
            activo: true,
          });
          creadas++;
        }
      }
    }
  }

  return creadas;
}

/**
 * Servicio idempotente para la generación de turnos a partir de plantillas de Horarios.
 * @param {Object} params
 * @param {string[]} [params.horarioIds] - Opcional: IDs específicos de horarios a generar
 * @param {string} [params.sede] - Opcional: ID de sede para filtrar horarios
 * @param {string} params.desde - Fecha inicial (YYYY-MM-DD)
 * @param {string} params.hasta - Fecha final (YYYY-MM-DD)
 * @param {boolean} [params.grillaCompleta] - Si es true, genera plantillas 07:00–22:00 L-D si faltan
 * @returns {Promise<{ creados: number, existentes: number, total: number, turnos: Array }>}
 */
export async function generarTurnos({ horarioIds, sede, desde, hasta, grillaCompleta = false }) {
  const startDate = dayjs(desde);
  const endDate = dayjs(hasta);

  if (!startDate.isValid() || !endDate.isValid()) {
    throw new Error("Fechas inválidas. Formato requerido: YYYY-MM-DD");
  }

  if (endDate.isBefore(startDate)) {
    throw new Error("La fecha 'hasta' no puede ser anterior a 'desde'");
  }

  const diffDays = endDate.diff(startDate, "day");
  if (diffDays > 90) {
    throw new Error("El rango de generación no puede superar los 90 días");
  }

  // Si se solicita grilla completa o no existen horarios aún, aseguramos la grilla 07:00–22:00
  if (grillaCompleta) {
    await asegurarGrillaHorarios({ sedeId: sede });
  }

  // 1. Obtener los horarios activos correspondientes
  const horarioFilter = { activo: true };
  if (Array.isArray(horarioIds) && horarioIds.length > 0) {
    horarioFilter._id = { $in: horarioIds };
  }
  if (sede) {
    horarioFilter.sede = sede;
  }

  let horarios = await Horario.find(horarioFilter).lean();

  // Si aún no hay horarios en absoluto, generamos la grilla completa automáticamente
  if (horarios.length === 0) {
    await asegurarGrillaHorarios({ sedeId: sede });
    horarios = await Horario.find(horarioFilter).lean();
  }

  if (horarios.length === 0) {
    return { creados: 0, existentes: 0, total: 0, turnos: [] };
  }

  // Agrupar horarios por día de la semana para lookup inmediato
  const horariosPorDia = {};
  for (const h of horarios) {
    if (!horariosPorDia[h.diaSemana]) {
      horariosPorDia[h.diaSemana] = [];
    }
    horariosPorDia[h.diaSemana].push(h);
  }

  // 2. Construir operaciones bulk para máxima performance en BD Cloud/Atlas
  const bulkOps = [];
  let currentDate = startDate;
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
    const fechaStr = currentDate.format("YYYY-MM-DD");
    const diaIndex = currentDate.day();
    const diaNombre = DIAS_MAP[diaIndex];

    const horariosDelDia = horariosPorDia[diaNombre] || [];

    for (const h of horariosDelDia) {
      bulkOps.push({
        updateOne: {
          filter: { horario: h._id, fecha: fechaStr },
          update: {
            $setOnInsert: {
              horario: h._id,
              fecha: fechaStr,
              horaInicio: h.horaInicio,
              cupoMax: h.cupoMax,
              cupoOcupado: 0,
              estado: "programado",
            },
          },
          upsert: true,
        },
      });
    }

    currentDate = currentDate.add(1, "day");
  }

  let creados = 0;
  let existentes = 0;
  if (bulkOps.length > 0) {
    const bulkRes = await Turno.bulkWrite(bulkOps, { ordered: false });
    creados = bulkRes.upsertedCount || 0;
    existentes = bulkOps.length - creados;
  }

  return {
    creados,
    existentes,
    total: creados + existentes,
  };
}

export default {
  generarTurnos,
  asegurarGrillaHorarios,
};
