import mongoose from "mongoose";

const { Schema } = mongoose;

const reservaSchema = new Schema(
  {
    alumno: {
      type: Schema.Types.ObjectId,
      ref: "Alumno",
      required: true,
      index: true,
    },
    turno: {
      type: Schema.Types.ObjectId,
      ref: "Turno",
      required: true,
      index: true,
    },
    // Entrenador asignado a esta reserva (se asigna cuando el profe toma el turno o coordinador asigna)
    entrenador: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    estado: {
      type: String,
      enum: [
        "sujeto_confirmacion",
        "pendiente",
        "confirmada",
        "cancelada",
        "asistio",
        "ausente",
        "recupero",
      ],
      default: "sujeto_confirmacion",
      index: true,
    },
    creadaPor: {
      tipo: {
        type: String,
        enum: ["tutor", "alumno", "staff"],
        required: true,
      },
      ref: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },
    motivoCancelacion: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Índices
reservaSchema.index({ alumno: 1, turno: 1 }, { unique: true });
reservaSchema.index({ turno: 1, estado: 1 });
reservaSchema.index({ entrenador: 1, estado: 1 });

export default mongoose.model("Reserva", reservaSchema);
