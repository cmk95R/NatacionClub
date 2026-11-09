import Tutor from "../models/Tutor.js";
import Alumno from "../models/Alumno.js";

// GET /api/admin/tutores
export const listTutores = async (req, res, next) => {
  try {
    const { search, estado } = req.query;
    const filter = {};

    if (estado) filter.estado = estado;

    if (search) {
      const rx = new RegExp(String(search).trim(), "i");
      filter.$or = [{ nombre: rx }, { apellido: rx }, { email: rx }, { telefono: rx }];
    }

    const tutores = await Tutor.find(filter)
      .populate("alumnos", "nombre apellido dni nivel activo aptoMedico")
      .sort({ apellido: 1, nombre: 1 })
      .lean();

    return res.json({ ok: true, tutores });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/tutores/:id
export const getTutorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Si es un tutor, solo puede consultar su propio perfil
    if (req.user.rol === "tutor" && req.user._id.toString() !== id) {
      return res.status(403).json({ message: "No tiene permiso para ver este tutor" });
    }

    const tutor = await Tutor.findById(id)
      .populate("alumnos", "nombre apellido dni nivel activo aptoMedico sede")
      .lean();

    if (!tutor) {
      return res.status(404).json({ message: "Tutor no encontrado" });
    }

    return res.json({ ok: true, tutor });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tutores
export const createTutor = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, telefono, alumnos } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    const existing = await Tutor.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "El email ya se encuentra registrado" });
    }

    const tutor = await Tutor.create({
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      email: cleanEmail,
      password: String(password).trim(),
      telefono: telefono ? String(telefono).trim() : "",
      alumnos: Array.isArray(alumnos) ? alumnos : [],
    });

    // Si se enviaron IDs de alumnos, asociar este tutor como tutorPrincipal
    if (Array.isArray(alumnos) && alumnos.length > 0) {
      await Alumno.updateMany(
        { _id: { $in: alumnos }, tutorPrincipal: null },
        { tutorPrincipal: tutor._id }
      );
    }

    return res.status(201).json({
      ok: true,
      message: "Tutor registrado exitosamente",
      tutor: tutor.toJSON(),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "El email ya se encuentra registrado" });
    }
    next(err);
  }
};

// PUT /api/admin/tutores/:id
export const updateTutor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, password, telefono, estado, alumnos } = req.body;

    const tutor = await Tutor.findById(id);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor no encontrado" });
    }

    if (email && email.toLowerCase() !== tutor.email) {
      const existing = await Tutor.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(409).json({ message: "El email ya pertenece a otro tutor" });
      }
      tutor.email = email.trim().toLowerCase();
    }

    if (nombre !== undefined) tutor.nombre = String(nombre).trim();
    if (apellido !== undefined) tutor.apellido = String(apellido).trim();
    if (telefono !== undefined) tutor.telefono = String(telefono).trim();
    if (estado !== undefined) tutor.estado = estado;
    if (password) tutor.password = String(password).trim();

    if (Array.isArray(alumnos)) {
      tutor.alumnos = alumnos;
    }

    await tutor.save();

    return res.json({
      ok: true,
      message: "Tutor actualizado exitosamente",
      tutor: tutor.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/tutores/:id (Baja lógica)
export const deleteTutor = async (req, res, next) => {
  try {
    const tutor = await Tutor.findByIdAndUpdate(
      req.params.id,
      { estado: "inactivo" },
      { new: true }
    ).lean();

    if (!tutor) {
      return res.status(404).json({ message: "Tutor no encontrado" });
    }

    return res.json({ ok: true, message: "Tutor deshabilitado exitosamente", tutor });
  } catch (err) {
    next(err);
  }
};

