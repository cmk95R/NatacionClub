import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import dayjs from "dayjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import User from "../src/models/User.js";
import Tutor from "../src/models/Tutor.js";
import Alumno from "../src/models/Alumno.js";
import Sede from "../src/models/Sede.js";
import Pileta from "../src/models/Pileta.js";
import Horario from "../src/models/Horario.js";
import Turno from "../src/models/Turno.js";
import Reserva from "../src/models/Reserva.js";
import Asistencia from "../src/models/Asistencia.js";
import Config from "../src/models/Config.js";
import { generarTurnos, asegurarGrillaHorarios } from "../src/services/turnos.service.js";
import { crearReserva } from "../src/services/cupo.service.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/club_natacion_dev";

async function runSeed() {
  console.log("🌊 Iniciando Seeder para Club de Natación...");
  console.log(`🔌 Conectando a: ${MONGO_URI}`);

  await mongoose.connect(MONGO_URI);
  console.log("✅ Conexión establecida a MongoDB.");

  // 1. Limpieza total de la base de datos de desarrollo
  console.log("🧹 Limpiando colecciones anteriores...");
  await Promise.all([
    User.deleteMany(),
    Tutor.deleteMany(),
    Alumno.deleteMany(),
    Sede.deleteMany(),
    Pileta.deleteMany(),
    Horario.deleteMany(),
    Turno.deleteMany(),
    Reserva.deleteMany(),
    Asistencia.deleteMany(),
    Config.deleteMany(),
  ]);
  console.log("✨ Colecciones limpiadas.");

  // 2. Feature Flags
  console.log("⚙️ Configurando Feature Flags iniciales...");
  await Config.create([
    { key: "reservas_abiertas", value: true },
    { key: "inscripciones_abiertas", value: true },
    { key: "ventana_reserva_dias", value: 30 },
    { key: "apto_medico_requerido", value: false },
    { key: "cancelacion_anticipacion_horas", value: 2 },
  ]);

  // 3. Sedes
  console.log("🏢 Creando sedes...");
  const sedeBelgrano = await Sede.create({
    nombre: "Sede Belgrano",
    direccion: "Av. Cabildo 1500, CABA",
    telefono: "11-4444-5555",
    activa: true,
  });

  const sedePalermo = await Sede.create({
    nombre: "Sede Palermo",
    direccion: "Av. Santa Fe 3200, CABA",
    telefono: "11-4444-6666",
    activa: true,
  });

  // 4. Piletas
  console.log("🏊 Creando piletas...");
  const piletaBelgrano1 = await Pileta.create({
    sede: sedeBelgrano._id,
    nombre: "Pileta Climatizada 25m",
    carriles: 6,
    activa: true,
  });

  const piletaBelgrano2 = await Pileta.create({
    sede: sedeBelgrano._id,
    nombre: "Pileta Formativa",
    carriles: 3,
    activa: true,
  });

  const piletaPalermo = await Pileta.create({
    sede: sedePalermo._id,
    nombre: "Pileta Olímpica 50m",
    carriles: 8,
    activa: true,
  });

  // 5. Staff (User)
  console.log("👤 Creando usuarios Staff...");
  const adminUser = await User.create({
    nombre: "Administrador",
    apellido: "Club",
    email: "admin@clubnatacion.com",
    password: "admin123",
    rol: "admin",
    telefono: "11-1000-0001",
    estado: "activo",
    sedes: [sedeBelgrano._id, sedePalermo._id],
  });

  const coordinadorUser = await User.create({
    nombre: "Marcos",
    apellido: "Coordinador",
    email: "coordinador@clubnatacion.com",
    password: "coord123",
    rol: "coordinador",
    telefono: "11-1000-0002",
    estado: "activo",
    sedes: [sedeBelgrano._id],
  });

  const entrenadorUser = await User.create({
    nombre: "Santiago",
    apellido: "Entrenador",
    email: "entrenador@clubnatacion.com",
    password: "coach123",
    rol: "entrenador",
    telefono: "11-1000-0003",
    estado: "activo",
    sedes: [sedeBelgrano._id, sedePalermo._id],
  });

  // 6. Tutores
  console.log("👨‍👩‍👧 Creando tutores...");
  const tutorCarlos = await Tutor.create({
    nombre: "Carlos",
    apellido: "López",
    email: "carlos.lopez@ejemplo.com",
    password: "tutor123",
    telefono: "11-2000-0001",
    estado: "activo",
  });

  const tutorMariana = await Tutor.create({
    nombre: "Mariana",
    apellido: "Gómez",
    email: "mariana.gomez@ejemplo.com",
    password: "tutor123",
    telefono: "11-2000-0002",
    estado: "activo",
  });

  // 7. Alumnos
  console.log("🧒 Creando alumnos...");
  const fechaAptoValido = dayjs().add(6, "month").toDate();

  const alumnoLucas = await Alumno.create({
    nombre: "Lucas",
    apellido: "López",
    dni: "48111222",
    fechaNacimiento: new Date("2012-05-15"),
    tutorPrincipal: tutorCarlos._id,
    sede: sedeBelgrano._id,
    nivel: "iniciacion",
    aptoMedico: { vence: fechaAptoValido, archivoId: "apto_lucas.pdf" },
    accesoApp: false,
    activo: true,
  });

  const alumnoSofia = await Alumno.create({
    nombre: "Sofía",
    apellido: "López",
    dni: "49222333",
    fechaNacimiento: new Date("2014-08-20"),
    tutorPrincipal: tutorCarlos._id,
    sede: sedeBelgrano._id,
    nivel: "intermedio",
    aptoMedico: { vence: fechaAptoValido, archivoId: "apto_sofia.pdf" },
    accesoApp: false,
    activo: true,
  });

  const alumnoMartin = await Alumno.create({
    nombre: "Martín",
    apellido: "Gómez",
    dni: "47333444",
    fechaNacimiento: new Date("2010-02-10"),
    tutorPrincipal: tutorMariana._id,
    sede: sedePalermo._id,
    nivel: "avanzado",
    aptoMedico: { vence: fechaAptoValido, archivoId: "apto_martin.pdf" },
    accesoApp: false,
    activo: true,
  });

  const alumnoJoaquin = await Alumno.create({
    nombre: "Joaquín",
    apellido: "Álvarez",
    dni: "40555666",
    fechaNacimiento: new Date("1998-11-04"), // Mayor de edad
    sede: sedeBelgrano._id,
    nivel: "iniciacion",
    aptoMedico: { vence: fechaAptoValido, archivoId: "apto_joaquin.pdf" },
    accesoApp: true,
    pin: "1234", // PIN de acceso app
    activo: true,
  });

  // Vincular alumnos a los tutores
  await Tutor.findByIdAndUpdate(tutorCarlos._id, {
    alumnos: [alumnoLucas._id, alumnoSofia._id],
  });
  await Tutor.findByIdAndUpdate(tutorMariana._id, {
    alumnos: [alumnoMartin._id],
  });

  // 8. Horarios (Plantillas completas de 07:00 a 22:00 hs, Lunes a Domingo)
  console.log("⏰ Creando plantillas de Horarios completas (07:00 a 22:00 hs, Lunes a Domingo)...");
  const plantillasCreadas = await asegurarGrillaHorarios();
  console.log(`✅ ${plantillasCreadas} plantillas de horarios creadas.`);

  // 9. Generar Turnos automáticos para los próximos 21 días (07:00 a 22:00 todos los días)
  console.log("📅 Generando turnos para las próximas 3 semanas...");
  const desde = dayjs().format("YYYY-MM-DD");
  const hasta = dayjs().add(21, "day").format("YYYY-MM-DD");

  const turnosGen = await generarTurnos({
    desde,
    hasta,
    grillaCompleta: true,
  });
  console.log(`✅ Turnos generados: ${turnosGen.creados} creados.`);

  // 10. Reserva de prueba
  console.log("🎫 Creando reserva de prueba...");
  const primerTurnoIniciacion = await Turno.findOne({
    fecha: { $gte: desde },
  });

  if (primerTurnoIniciacion) {
    const resTest = await crearReserva({
      alumnoId: alumnoLucas._id,
      turnoId: primerTurnoIniciacion._id,
      usuarioSolicitante: tutorCarlos,
    });
    console.log(`✅ Reserva de prueba creada exitosamente para Lucas López en turno ${primerTurnoIniciacion.fecha} (${resTest.estado}).`);
  }

  console.log("\n========================================================");
  console.log("🎉 SEED COMPLETADO CON ÉXITO");
  console.log("========================================================");
  console.log("Credenciales de prueba creadas:");
  console.log("👉 Admin:       admin@clubnatacion.com       / admin123");
  console.log("👉 Coordinador: coordinador@clubnatacion.com / coord123");
  console.log("👉 Entrenador:  entrenador@clubnatacion.com  / coach123");
  console.log("👉 Tutor:       carlos.lopez@ejemplo.com     / tutor123");
  console.log("👉 Alumno (PIN): DNI 40555666                 / PIN 1234");
  console.log("========================================================\n");

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error("❌ Error ejecutando seed:", err);
  process.exit(1);
});

