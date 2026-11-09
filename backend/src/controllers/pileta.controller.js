import Pileta from "../models/Pileta.js";
import Sede from "../models/Sede.js";
import Horario from "../models/Horario.js";

// GET /api/admin/piletas o GET /api/piletas
export const listPiletas = async (req, res, next) => {
  try {
    const { sede, activa } = req.query;
    const filter = {};

    if (sede) {
      filter.sede = sede;
    }

    if (activa !== undefined) {
      filter.activa = activa === "true";
    }

    const piletas = await Pileta.find(filter)
      .populate("sede", "nombre direccion activa")
      .sort({ nombre: 1 })
      .lean();

    return res.json({ ok: true, piletas });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/piletas/:id
export const getPiletaById = async (req, res, next) => {
  try {
    const pileta = await Pileta.findById(req.params.id)
      .populate("sede", "nombre direccion activa")
      .lean();

    if (!pileta) {
      return res.status(404).json({ message: "Pileta no encontrada" });
    }

    return res.json({ ok: true, pileta });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/piletas
export const createPileta = async (req, res, next) => {
  try {
    const { sede, nombre, carriles, activa } = req.body;

    const sedeDoc = await Sede.findById(sede);
    if (!sedeDoc) {
      return res.status(404).json({ message: "La sede especificada no existe" });
    }

    const pileta = await Pileta.create({
      sede,
      nombre: String(nombre).trim(),
      carriles: Number(carriles) || 1,
      activa: activa !== undefined ? Boolean(activa) : true,
    });

    return res.status(201).json({ ok: true, message: "Pileta creada con éxito", pileta });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/piletas/:id
export const updatePileta = async (req, res, next) => {
  try {
    const { sede, nombre, carriles, activa } = req.body;
    const update = {};

    if (sede) {
      const sedeDoc = await Sede.findById(sede);
      if (!sedeDoc) {
        return res.status(404).json({ message: "La sede especificada no existe" });
      }
      update.sede = sede;
    }

    if (nombre !== undefined) update.nombre = String(nombre).trim();
    if (carriles !== undefined) update.carriles = Number(carriles);
    if (activa !== undefined) update.activa = Boolean(activa);

    const pileta = await Pileta.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate("sede", "nombre direccion")
      .lean();

    if (!pileta) {
      return res.status(404).json({ message: "Pileta no encontrada" });
    }

    return res.json({ ok: true, message: "Pileta actualizada con éxito", pileta });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/piletas/:id (baja lógica)
export const deletePileta = async (req, res, next) => {
  try {
    const { id } = req.params;

    const horariosActivos = await Horario.countDocuments({ pileta: id, activo: true });
    if (horariosActivos > 0) {
      return res.status(400).json({
        message: "No se puede dar de baja la pileta porque tiene plantillas de horarios activas",
      });
    }

    const pileta = await Pileta.findByIdAndUpdate(
      id,
      { activa: false },
      { new: true }
    ).lean();

    if (!pileta) {
      return res.status(404).json({ message: "Pileta no encontrada" });
    }

    return res.json({ ok: true, message: "Pileta deshabilitada con éxito", pileta });
  } catch (err) {
    next(err);
  }
};

