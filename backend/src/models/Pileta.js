import mongoose from "mongoose";

const { Schema } = mongoose;

const piletaSchema = new Schema(
  {
    sede: {
      type: Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
      index: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    carriles: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    activa: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Pileta", piletaSchema);

