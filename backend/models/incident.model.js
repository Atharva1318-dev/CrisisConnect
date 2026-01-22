import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true, // e.g., "Fire", "Flood", "Medical"
    },
    description: String,
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    mode: {
      type: String,
      enum: ["VOICE", "IMAGE_TEXT"],
      required: true
    },
    transcript: {
      type: String // Only for VOICE mode
    },
    translatedTranscript: {
      type: String // Optional: translated transcript (e.g., English)
    },
    imageUrl: {
      type: String // Only for IMAGE_TEXT mode (stored in Cloudinary)
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true } // [Longitude, Latitude] from geolocation
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Resolved", "Spam"],
      default: "Pending"
    },
    trustScore: {
      type: Number,
      default: 0
    },
    reportedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    dispatchedResources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource"
      }
    ]
  },
  { timestamps: true }
);

// Create a geospatial index for fast map queries
incidentSchema.index({ location: "2dsphere" });//index ka use is similar to book ka index hota hai, fast searching ke liye
//exactly agar without index karenge to pura search karega konse ambulance mere se kitne door hai, but with index wo jaldi se pata kar lega index me ek tree banayega jo fast searching ke liye use hota hai       2d sphere ke wajah se geospeatial queries kar sakte hai like $near nhi lagaya toh woh normal x y coordinate ke hisab se karega distance calculate but 2dsphere lagane se earth ke hisab se karega distance calculate $geoWithin yeh sab nhi hoga without 2dsphere index

const Incident = mongoose.model("Incident", incidentSchema);
export default Incident;