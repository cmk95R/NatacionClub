// backend/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

dotenv.config();

// Validación estricta de variables de entorno críticas
const REQUIRED_ENVS = ["MONGO_URI", "JWT_SECRET", "SESSION_SECRET", "FRONTEND_URL"];
const missingEnvs = REQUIRED_ENVS.filter((key) => !process.env[key]);
if (missingEnvs.length > 0) {
  console.error(`❌ Variables de entorno faltantes requeridas: ${missingEnvs.join(", ")}`);
  process.exit(1);
}

import connectDB from "./db/db.js";
import { generalLimiter } from "./middleware/rateLimit.middleware.js";
import authRoutes from "./routes/authRoutes.js";
import configRoutes from "./routes/config.routes.js";
import sedeRoutes from "./routes/sede.routes.js";
import piletaRoutes from "./routes/pileta.routes.js";
import horarioRoutes from "./routes/horario.routes.js";
import alumnoRoutes from "./routes/alumno.routes.js";
import tutorRoutes from "./routes/tutor.routes.js";
import fileRoutes from "./routes/file.routes.js";
import turnoRoutes from "./routes/turno.routes.js";
import reservaRoutes from "./routes/reserva.routes.js";
import asistenciaRoutes from "./routes/asistencia.routes.js";
import staffRoutes from "./routes/staff.routes.js";

const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

app.set("trust proxy", IS_PROD ? 1 : 0);

// --- Seguridad baseline ---
app.use(helmet());
app.use(mongoSanitize());

// Rate limit general (por IP)
app.use("/api", generalLimiter);

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// --- CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

if (process.env.FRONTEND_URL) {
  const origins = process.env.FRONTEND_URL.split(",").map((url) => {
    const u = url.trim().replace(/\/$/, "");
    return u.startsWith("http") ? u : `https://${u}`;
  });
  allowedOrigins.push(...origins);
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, "");

    // En desarrollo, permitir cualquier puerto de localhost o 127.0.0.1
    if (!IS_PROD) {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// --- Health Check ---
app.get("/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// --- Router Principal /api ---
const apiRouter = express.Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/config", configRoutes);
apiRouter.use("/admin/config", configRoutes);

// Catálogo (Sedes, Piletas, Horarios)
apiRouter.use("/sedes", sedeRoutes);
apiRouter.use("/piletas", piletaRoutes);
apiRouter.use("/horarios", horarioRoutes);
apiRouter.use("/admin/sedes", sedeRoutes);
apiRouter.use("/admin/piletas", piletaRoutes);
apiRouter.use("/admin/horarios", horarioRoutes);

// Alumnos y Tutores
apiRouter.use("/alumnos", alumnoRoutes);
apiRouter.use("/admin/alumnos", alumnoRoutes);
apiRouter.use("/tutores", tutorRoutes);
apiRouter.use("/admin/tutores", tutorRoutes);

// Staff y Entrenadores
apiRouter.use("/staff", staffRoutes);
apiRouter.use("/admin/staff", staffRoutes);

// Archivos (Aptos médicos, fotos)
apiRouter.use("/files", fileRoutes);

// Turnos
apiRouter.use("/turnos", turnoRoutes);
apiRouter.use("/admin/turnos", turnoRoutes);

// Reservas
apiRouter.use("/reservas", reservaRoutes);

// Asistencia
apiRouter.use("/asistencia", asistenciaRoutes);

// Montaje de /api
app.use("/api", apiRouter);

// --- Manejo de 404 ---
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ message: "Endpoint de API no encontrado" });
  }
  res.status(404).send("Not Found");
});

// --- Manejo de errores global ---
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error no controlado:", err);
  }
  res.status(err.status || 500).json({
    message: IS_PROD ? "Error interno del servidor" : (err.message || "Error interno del servidor"),
  });
});

// --- Inicio y Conexión DB ---
const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ API lista en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err?.message || err);
    process.exit(1);
  });

export default app;
