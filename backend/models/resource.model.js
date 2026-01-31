import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    item_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    category: { type: String, enum: ["Food", "Medical", "Equipment", "Shelter", "Rescue"] },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    status: {
      type: String,
      enum: ["Available", "Depleted", "Reserved", "Maintenance", "Deployed"],
      default: "Available",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    current_incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      default: null
    }
  },
  { timestamps: true }
);

resourceSchema.index({ location: "2dsphere" });
const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;