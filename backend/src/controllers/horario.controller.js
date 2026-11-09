import Horario from "../models/Horario.js";
import Pileta from "../models/Pileta.js";
import User from "../models/User.js";

// GET /api/horarios o GET /api/admin/horarios
export const listHorarios = async (req, res, next) => {
  try {
    const { sede, pileta, diaSemana, nivel, entrenador, activo } = req.query;
    const filter = {};

    if (sede) filter.sede = sede;
    if (pileta) filter.pileta = pileta;
    if (diaSemana) filter.diaSemana = diaSemana;
    if (nivel) filter.nivel = nivel;
    if (entrenador) filter.entrenador = entrenador;

    if (activo !== undefined) {
      filter.activo = activo === "true";
    }

    const horarios = await Horario.find(filter)
      .populate("sede", "nombre direccion")
      .populate("pileta", "nombre carriles")
      .populate("entrenador", "nombre apellido email telefono")
      .sort({ diaSemana: 1, horaInicio: 1 })
      .lean();

    return res.json({ ok: true, horarios });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/horarios/:id o GET /api/horarios/:id
export const getHorarioById = async (req, res, next) => {
  try {
    const horario = await Horario.findById(req.params.id)
      .populate("sede", "nombre direccion")
      .populate("pileta", "nombre carriles")
      .populate("entrenador", "nombre apellido email telefono")
      .lean();

    if (!horario) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    return res.json({ ok: true, horario });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/horarios
export const createHorario = async (req, res, next) => {
  try {
    const {
      sede,
      pileta,
      carril,
      entrenador,
      diaSemana,
      horaInicio,
      duracionMin,
      cupoMax,
      nivel,
      activo,
    } = req.body;

    const piletaDoc = await Pileta.findById(pileta);
    if (!piletaDoc) {
      return res.status(404).json({ message: "La pileta especificada no existe" });
    }

    if (carril > piletaDoc.carriles) {
      return res.status(400).json({
        message: `El carril ${carril} excede la cantidad total de carriles de la pileta (${piletaDoc.carriles})`,
      });
    }

    if (entrenador) {
      const coach = await User.findById(entrenador);
      if (!coach) {
        return res.status(404).json({ message: "El entrenador asignado no existe" });
      }
    }

    const horario = await Horario.create({
      sede,
      pileta,
      carril: Number(carril) || 1,
      entrenador: entrenador || null,
      diaSemana,
      horaInicio,
      duracionMin: Number(duracionMin) || 60,
      cupoMax: Number(cupoMax),
      nivel,
      activo: activo !== undefined ? Boolean(activo) : true,
    });

    const populated = await Horario.findById(horario._id)
      .populate("sede", "nombre")
      .populate("pileta", "nombre carriles")
      .populate("entrenador", "nombre apellido")
      .lean();

    return res.status(201).json({
      ok: true,
      message: "Horario creado con éxito",
      horario: populated,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/horarios/:id
export const updateHorario = async (req, res, next) => {
  try {
    const {
      sede,
      pileta,
      carril,
      entrenador,
      diaSemana,
      horaInicio,
      duracionMin,
      cupoMax,
      nivel,
      activo,
    } = req.body;

    const update = {};
    if (sede) update.sede = sede;
    if (pileta) {
      const piletaDoc = await Pileta.findById(pileta);
      if (!piletaDoc) {
        return res.status(404).json({ message: "La pileta no existe" });
      }
      update.pileta = pileta;
    }
    if (carril !== undefined) update.carril = Number(carril);
    if (entrenador !== undefined) update.entrenador = entrenador || null;
    if (diaSemana) update.diaSemana = diaSemana;
    if (horaInicio) update.horaInicio = horaInicio;
    if (duracionMin !== undefined) update.duracionMin = Number(duracionMin);
    if (cupoMax !== undefined) update.cupoMax = Number(cupoMax);
    if (nivel) update.nivel = nivel;
    if (activo !== undefined) update.activo = Boolean(activo);

    const horario = await Horario.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate("sede", "nombre")
      .populate("pileta", "nombre carriles")
      .populate("entrenador", "nombre apellido")
      .lean();

    if (!horario) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    return res.json({ ok: true, message: "Horario actualizado con éxito", horario });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/horarios/:id (baja lógica)
export const deleteHorario = async (req, res, next) => {
  try {
    const horario = await Horario.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    ).lean();

    if (!horario) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    return res.json({ ok: true, message: "Horario deshabilitado con éxito", horario });
  } catch (err) {
    next(err);
  }
};

