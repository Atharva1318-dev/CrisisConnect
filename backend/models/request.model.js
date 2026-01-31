import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
    {
        agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true },
        resourcesRequested: [
            {
                item_name: String,
                category: String,
                quantity: Number
            }
        ],
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending"
        },
        message: String // Optional message from Agency
    },
    { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);
export default Request;