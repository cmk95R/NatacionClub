import Sede from "../models/Sede.js";
import Pileta from "../models/Pileta.js";

// GET /api/admin/sedes o GET /api/sedes
export const listSedes = async (req, res, next) => {
  try {
    const { activa, search } = req.query;
    const filter = {};

    if (activa !== undefined) {
      filter.activa = activa === "true";
    }

    if (search) {
      filter.nombre = new RegExp(String(search).trim(), "i");
    }

    const sedes = await Sede.find(filter).sort({ nombre: 1 }).lean();
    return res.json({ ok: true, sedes });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/sedes/:id
export const getSedeById = async (req, res, next) => {
  try {
    const sede = await Sede.findById(req.params.id).lean();
    if (!sede) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }
    return res.json({ ok: true, sede });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/sedes
export const createSede = async (req, res, next) => {
  try {
    const { nombre, direccion, telefono, activa } = req.body;
    const sede = await Sede.create({
      nombre: String(nombre).trim(),
      direccion: direccion ? String(direccion).trim() : "",
      telefono: telefono ? String(telefono).trim() : "",
      activa: activa !== undefined ? Boolean(activa) : true,
    });

    return res.status(201).json({ ok: true, message: "Sede creada con éxito", sede });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/sedes/:id
export const updateSede = async (req, res, next) => {
  try {
    const { nombre, direccion, telefono, activa } = req.body;
    const update = {};

    if (nombre !== undefined) update.nombre = String(nombre).trim();
    if (direccion !== undefined) update.direccion = String(direccion).trim();
    if (telefono !== undefined) update.telefono = String(telefono).trim();
    if (activa !== undefined) update.activa = Boolean(activa);

    const sede = await Sede.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!sede) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }

    return res.json({ ok: true, message: "Sede actualizada con éxito", sede });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/sedes/:id (baja lógica)
export const deleteSede = async (req, res, next) => {
  try {
    const { id } = req.params;
    const piletasActivas = await Pileta.countDocuments({ sede: id, activa: true });

    if (piletasActivas > 0) {
      return res.status(400).json({
        message: "No se puede dar de baja la sede porque tiene piletas activas asociadas",
      });
    }

    const sede = await Sede.findByIdAndUpdate(
      id,
      { activa: false },
      { new: true }
    ).lean();

    if (!sede) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }

    return res.json({ ok: true, message: "Sede deshabilitada con éxito", sede });
  } catch (err) {
    next(err);
  }
};

