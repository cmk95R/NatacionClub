import User from "../models/User.js";
import Sede from "../models/Sede.js";

// GET /api/admin/staff (o GET /api/staff para listado de entrenadores)
export const listStaff = async (req, res, next) => {
  try {
    const { rol, sede, estado, search } = req.query;
    const filter = {};

    if (rol) {
      filter.rol = rol;
    } else {
      filter.rol = { $in: ["admin", "coordinador", "entrenador"] };
    }

    if (sede) {
      filter.sedes = sede;
    }

    if (estado) {
      filter.estado = estado;
    }

    if (search) {
      const rx = new RegExp(String(search).trim(), "i");
      filter.$or = [{ nombre: rx }, { apellido: rx }, { email: rx }];
    }

    const staff = await User.find(filter)
      .select("-password")
      .populate("sedes", "nombre direccion")
      .sort({ apellido: 1, nombre: 1 })
      .lean();

    return res.json({ ok: true, staff });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/staff/:id
export const getStaffById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("sedes", "nombre direccion")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Usuario de staff no encontrado" });
    }

    return res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/staff
export const createStaff = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, rol, sedes, telefono, estado } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({
        message: "Nombre, apellido, email y contraseña son obligatorios",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "El correo electrónico ya está registrado" });
    }

    // Validar sedes si se proporcionaron
    if (Array.isArray(sedes) && sedes.length > 0) {
      const validSedesCount = await Sede.countDocuments({ _id: { $in: sedes } });
      if (validSedesCount !== sedes.length) {
        return res.status(400).json({ message: "Una o más sedes seleccionadas no son válidas" });
      }
    }

    const nuevoUser = new User({
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      email: normalizedEmail,
      password, // el hook pre-save se encarga del hash
      rol: rol || "entrenador",
      sedes: sedes || [],
      telefono: telefono ? String(telefono).trim() : "",
      estado: estado || "activo",
    });

    await nuevoUser.save();

    const result = await User.findById(nuevoUser._id)
      .select("-password")
      .populate("sedes", "nombre direccion")
      .lean();

    return res.status(201).json({
      ok: true,
      message: "Usuario creado exitosamente",
      user: result,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/staff/:id
export const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, password, rol, sedes, telefono, estado } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario de staff no encontrado" });
    }

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const emailTaken = await User.findOne({ email: normalizedEmail });
        if (emailTaken) {
          return res.status(409).json({ message: "El correo electrónico ya está en uso por otro usuario" });
        }
        user.email = normalizedEmail;
      }
    }

    if (nombre) user.nombre = String(nombre).trim();
    if (apellido) user.apellido = String(apellido).trim();
    if (rol) user.rol = rol;
    if (telefono !== undefined) user.telefono = String(telefono).trim();
    if (estado) user.estado = estado;
    if (sedes !== undefined) user.sedes = Array.isArray(sedes) ? sedes : [];

    if (password && String(password).trim().length > 0) {
      user.password = password; // Se hasheará por el pre-save hook
    }

    await user.save();

    const result = await User.findById(user._id)
      .select("-password")
      .populate("sedes", "nombre direccion")
      .lean();

    return res.json({
      ok: true,
      message: "Usuario de staff actualizado exitosamente",
      user: result,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/staff/:id (Inactivar usuario)
export const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Toggle o desactivación
    user.estado = "inactivo";
    await user.save();

    return res.json({
      ok: true,
      message: "Usuario de staff marcado como inactivo",
    });
  } catch (err) {
    next(err);
  }
};
