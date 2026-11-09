import mongoose from "mongoose";

const { Schema } = mongoose;

const asistenciaSchema = new Schema(
  {
    turno: {
      type: Schema.Types.ObjectId,
      ref: "Turno",
      required: true,
      index: true,
    },
    alumno: {
      type: Schema.Types.ObjectId,
      ref: "Alumno",
      required: true,
      index: true,
    },
    estado: {
      type: String,
      enum: ["presente", "ausente", "justificada", "recupero"],
      required: true,
      default: "presente",
      index: true,
    },
    nota: {
      type: String,
      trim: true,
      default: "",
    },
    registradoPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Índice único según Context.md: (turno, alumno)
asistenciaSchema.index({ turno: 1, alumno: 1 }, { unique: true });

export default mongoose.model("Asistencia", asistenciaSchema);

