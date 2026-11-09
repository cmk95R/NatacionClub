import mongoose from "mongoose";

const { Schema } = mongoose;

const turnoSchema = new Schema(
  {
    horario: {
      type: Schema.Types.ObjectId,
      ref: "Horario",
      required: true,
      index: true,
    },
    fecha: {
      type: String, // Formato YYYY-MM-DD
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    horaInicio: {
      type: String, // Formato HH:mm
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    cupoMax: {
      type: Number,
      required: true,
      min: 1,
    },
    cupoOcupado: {
      type: Number,
      default: 0,
      min: 0,
    },
    estado: {
      type: String,
      enum: ["programado", "suspendido", "finalizado"],
      default: "programado",
      index: true,
    },
  },
  { timestamps: true }
);

// Índice único crucial según Context.md: (horario, fecha)
turnoSchema.index({ horario: 1, fecha: 1 }, { unique: true });
turnoSchema.index({ fecha: 1, estado: 1 });

export default mongoose.model("Turno", turnoSchema);

