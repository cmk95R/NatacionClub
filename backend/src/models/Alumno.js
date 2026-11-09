import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const alumnoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
    },
    dni: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fechaNacimiento: {
      type: Date,
    },
    telefono: {
      type: String,
      trim: true,
      default: "",
    },
    tutorPrincipal: {
      type: Schema.Types.ObjectId,
      ref: "Tutor",
      index: true,
    },
    tutoresSecundarios: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tutor",
      },
    ],
    sede: {
      type: Schema.Types.ObjectId,
      ref: "Sede",
      index: true,
    },
    nivel: {
      type: String,
      enum: ["iniciacion", "intermedio", "avanzado", "competitivo"],
      default: "iniciacion",
      index: true,
    },
    aptoMedico: {
      vence: { type: Date },
      archivoId: { type: String, default: "" },
    },
    accesoApp: {
      type: Boolean,
      default: false,
      index: true,
    },
    pin: {
      type: String,
      select: false,
    },
    notas: {
      type: String,
      trim: true,
      default: "",
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    rol: {
      type: String,
      default: "alumno",
      immutable: true,
    },
  },
  { timestamps: true }
);

// Hash de PIN si fue modificado
alumnoSchema.pre("save", async function (next) {
  if (!this.isModified("pin") || !this.pin) return next();
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

// Comparar PIN numérico
alumnoSchema.methods.comparePin = function (plainPin) {
  if (!this.pin) return false;
  return bcrypt.compare(plainPin, this.pin);
};

// Ocultar PIN en serialización
alumnoSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.pin;
  return obj;
};

export default mongoose.model("Alumno", alumnoSchema);

