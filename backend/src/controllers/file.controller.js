import path from "path";
import fs from "fs";
import Alumno from "../models/Alumno.js";
import { canAccessAlumno } from "../utils/ownership.js";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

// POST /api/files
export const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se proporcionó ningún archivo" });
  }

  return res.status(201).json({
    ok: true,
    message: "Archivo subido correctamente",
    id: req.file.filename,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
};

// GET /api/files/:id (Descarga con control de ownership)
export const getFile = async (req, res, next) => {
  try {
    const rawId = req.params.id;
    // Sanitización contra directory traversal
    const safeFilename = path.basename(rawId);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    const user = req.user;

    // 1. Staff siempre tiene permiso de lectura
    if (["admin", "coordinador", "entrenador"].includes(user.rol)) {
      return res.sendFile(filePath);
    }

    // 2. Verificar si es apto médico de algún alumno
    const alumno = await Alumno.findOne({ "aptoMedico.archivoId": safeFilename });
    if (alumno) {
      if (canAccessAlumno(user, alumno)) {
        return res.sendFile(filePath);
      }
      return res.status(403).json({ message: "No tiene permiso para descargar este archivo" });
    }

    // 3. Si no está vinculado a un alumno ni es staff, denegar
    return res.status(403).json({ message: "No autorizado para acceder a este archivo" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/files/:id (Solo staff administrativo)
export const deleteFile = async (req, res, next) => {
  try {
    const safeFilename = path.basename(req.params.id);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    // Desasociar del alumno si estaba asignado
    await Alumno.updateMany(
      { "aptoMedico.archivoId": safeFilename },
      { $set: { "aptoMedico.archivoId": "" } }
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ ok: true, message: "Archivo eliminado correctamente" });
  } catch (err) {
    next(err);
  }
};

