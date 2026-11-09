import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const tutorSchema = new Schema(
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    telefono: {
      type: String,
      trim: true,
      default: "",
    },
    alumnos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Alumno",
      },
    ],
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
      index: true,
    },
    rol: {
      type: String,
      default: "tutor",
      immutable: true,
    },
  },
  { timestamps: true }
);

// Hash de password antes de guardar
tutorSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Comparar contraseña
tutorSchema.methods.comparePassword = function (plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

// Ocultar datos sensibles en JSON
tutorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("Tutor", tutorSchema);

