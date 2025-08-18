import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    smallDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory" },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    fileKey: { type: String },   
    videoUrl: { type: String },   
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);
export default Service;
