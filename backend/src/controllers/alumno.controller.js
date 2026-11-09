import Alumno from "../models/Alumno.js";
import Tutor from "../models/Tutor.js";
import Sede from "../models/Sede.js";
import { canAccessAlumno } from "../utils/ownership.js";

// Helper para calcular edad
const getAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// GET /api/alumnos (Staff: admin, coordinador, entrenador)
export const listAlumnos = async (req, res, next) => {
  try {
    const { search, sede, nivel, activo } = req.query;
    const filter = {};

    if (sede) filter.sede = sede;
    if (nivel) filter.nivel = nivel;

    if (activo !== undefined) {
      filter.activo = activo === "true";
    }

    if (search) {
      const rx = new RegExp(String(search).trim(), "i");
      filter.$or = [{ nombre: rx }, { apellido: rx }, { dni: rx }];
    }

    const alumnos = await Alumno.find(filter)
      .populate("sede", "nombre direccion")
      .populate("tutorPrincipal", "nombre apellido email telefono")
      .sort({ apellido: 1, nombre: 1 })
      .lean();

    return res.json({ ok: true, alumnos });
  } catch (err) {
    next(err);
  }
};

// GET /api/alumnos/mis-hijos (Tutor)
export const listMisHijos = async (req, res, next) => {
  try {
    const tutorId = req.user._id;
    const alumnos = await Alumno.find({
      $or: [{ tutorPrincipal: tutorId }, { tutoresSecundarios: tutorId }],
      activo: true,
    })
      .populate("sede", "nombre direccion")
      .sort({ nombre: 1 })
      .lean();

    return res.json({ ok: true, alumnos });
  } catch (err) {
    next(err);
  }
};

// GET /api/alumnos/:id (Protegido por ownership)
export const getAlumnoById = async (req, res, next) => {
  try {
    const alumno = await Alumno.findById(req.params.id)
      .populate("sede", "nombre direccion")
      .populate("tutorPrincipal", "nombre apellido email telefono")
      .populate("tutoresSecundarios", "nombre apellido email telefono");

    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    if (!canAccessAlumno(req.user, alumno)) {
      return res.status(403).json({ message: "No tiene permiso para ver este alumno" });
    }

    return res.json({ ok: true, alumno: alumno.toJSON() });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/alumnos (Solo admin y coordinador)
export const createAlumno = async (req, res, next) => {
  try {
    const {
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      telefono,
      tutorPrincipal,
      tutoresSecundarios,
      sede,
      nivel,
      aptoMedico,
      accesoApp,
      pin,
      notas,
    } = req.body;

    // 1. Validar DNI duplicado
    const existingDni = await Alumno.findOne({ dni: String(dni).trim() });
    if (existingDni) {
      return res.status(409).json({ message: "El DNI ingresado ya está registrado" });
    }

    // 2. Validar sede
    if (sede) {
      const sedeExists = await Sede.findById(sede);
      if (!sedeExists) {
        return res.status(404).json({ message: "La sede especificada no existe" });
      }
    }

    // 3. Validar menor de 18 años requiere tutor
    if (fechaNacimiento) {
      const age = getAge(fechaNacimiento);
      if (age !== null && age < 18 && !tutorPrincipal) {
        return res.status(400).json({
          message: "Los alumnos menores de 18 años requieren obligatoriamente un tutor responsable",
        });
      }
    }

    // 4. Validar tutor principal si fue provisto
    if (tutorPrincipal) {
      const tutorDoc = await Tutor.findById(tutorPrincipal);
      if (!tutorDoc) {
        return res.status(404).json({ message: "El tutor principal especificado no existe" });
      }
    }

    // 5. Validar PIN si se habilita accesoApp
    const wantsApp = Boolean(accesoApp);
    if (wantsApp && (!pin || !/^\d{4,6}$/.test(String(pin)))) {
      return res.status(400).json({
        message: "Para habilitar acceso a la app se requiere un PIN numérico de 4 a 6 dígitos",
      });
    }

    const payload = {
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      dni: String(dni).trim(),
      fechaNacimiento: fechaNacimiento || null,
      telefono: telefono ? String(telefono).trim() : "",
      tutorPrincipal: tutorPrincipal || null,
      tutoresSecundarios: Array.isArray(tutoresSecundarios) ? tutoresSecundarios : [],
      sede: sede || null,
      nivel: nivel || "iniciacion",
      aptoMedico: aptoMedico || {},
      accesoApp: wantsApp,
      notas: notas ? String(notas).trim() : "",
    };

    if (wantsApp && pin) {
      payload.pin = String(pin).trim();
    }

    const alumno = await Alumno.create(payload);

    // Actualizar array de alumnos en Tutor
    if (tutorPrincipal) {
      await Tutor.findByIdAndUpdate(tutorPrincipal, {
        $addToSet: { alumnos: alumno._id },
      });
    }

    const populated = await Alumno.findById(alumno._id)
      .populate("sede", "nombre direccion")
      .populate("tutorPrincipal", "nombre apellido email");

    return res.status(201).json({
      ok: true,
      message: "Alumno dado de alta exitosamente",
      alumno: populated.toJSON(),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "El DNI ya se encuentra registrado" });
    }
    next(err);
  }
};

// PUT /api/admin/alumnos/:id (Solo admin y coordinador)
export const updateAlumno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      telefono,
      tutorPrincipal,
      tutoresSecundarios,
      sede,
      nivel,
      aptoMedico,
      accesoApp,
      pin,
      notas,
      activo,
    } = req.body;

    const alumno = await Alumno.findById(id);
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    if (dni && dni !== alumno.dni) {
      const existing = await Alumno.findOne({ dni: String(dni).trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ message: "El DNI ingresado ya está registrado por otro alumno" });
      }
      alumno.dni = String(dni).trim();
    }

    if (nombre !== undefined) alumno.nombre = String(nombre).trim();
    if (apellido !== undefined) alumno.apellido = String(apellido).trim();
    if (fechaNacimiento !== undefined) alumno.fechaNacimiento = fechaNacimiento;
    if (telefono !== undefined) alumno.telefono = String(telefono).trim();
    if (sede !== undefined) alumno.sede = sede || null;
    if (nivel !== undefined) alumno.nivel = nivel;
    if (notas !== undefined) alumno.notas = String(notas).trim();
    if (activo !== undefined) alumno.activo = Boolean(activo);
    if (aptoMedico !== undefined) alumno.aptoMedico = aptoMedico;

    // Manejo de cambio de tutor
    const oldTutor = alumno.tutorPrincipal ? alumno.tutorPrincipal.toString() : null;
    if (tutorPrincipal !== undefined) {
      alumno.tutorPrincipal = tutorPrincipal || null;
      if (oldTutor && oldTutor !== String(tutorPrincipal)) {
        await Tutor.findByIdAndUpdate(oldTutor, { $pull: { alumnos: alumno._id } });
      }
      if (tutorPrincipal) {
        await Tutor.findByIdAndUpdate(tutorPrincipal, { $addToSet: { alumnos: alumno._id } });
      }
    }

    if (tutoresSecundarios !== undefined && Array.isArray(tutoresSecundarios)) {
      alumno.tutoresSecundarios = tutoresSecundarios;
    }

    if (accesoApp !== undefined) {
      alumno.accesoApp = Boolean(accesoApp);
    }

    if (pin) {
      if (!/^\d{4,6}$/.test(String(pin))) {
        return res.status(400).json({ message: "El PIN debe tener entre 4 y 6 dígitos numéricos" });
      }
      alumno.pin = String(pin).trim();
    }

    await alumno.save();

    const populated = await Alumno.findById(alumno._id)
      .populate("sede", "nombre direccion")
      .populate("tutorPrincipal", "nombre apellido email")
      .populate("tutoresSecundarios", "nombre apellido email");

    return res.json({
      ok: true,
      message: "Alumno actualizado correctamente",
      alumno: populated.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/alumnos/:id (Baja lógica)
export const deleteAlumno = async (req, res, next) => {
  try {
    const alumno = await Alumno.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    ).lean();

    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    return res.json({ ok: true, message: "Alumno dado de baja correctamente", alumno });
  } catch (err) {
    next(err);
  }
};

