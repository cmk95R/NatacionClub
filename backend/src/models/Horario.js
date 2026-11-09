import mongoose from "mongoose";

const { Schema } = mongoose;

const horarioSchema = new Schema(
  {
    sede: {
      type: Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
      index: true,
    },
    pileta: {
      type: Schema.Types.ObjectId,
      ref: "Pileta",
      required: true,
      index: true,
    },
    carril: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    entrenador: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    diaSemana: {
      type: String,
      enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
      required: true,
      index: true,
    },
    horaInicio: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // formato HH:mm
    },
    duracionMin: {
      type: Number,
      required: true,
      default: 60,
      min: 15,
    },
    cupoMax: {
      type: Number,
      required: true,
      min: 1,
    },
    nivel: {
      type: String,
      enum: ["iniciacion", "intermedio", "avanzado", "competitivo"],
      required: true,
      index: true,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

horarioSchema.index({ sede: 1, diaSemana: 1, activo: 1 });

export default mongoose.model("Horario", horarioSchema);

