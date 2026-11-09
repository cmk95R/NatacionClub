import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const userSchema = new Schema(
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
    rol: {
      type: String,
      enum: ["admin", "coordinador", "entrenador"],
      default: "entrenador",
      index: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    foto: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
      index: true,
    },
    sedes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Sede",
      },
    ],
  },
  { timestamps: true }
);

// Hash de password antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Comparar contraseña
userSchema.methods.comparePassword = function (plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

// Ocultar datos sensibles en JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
