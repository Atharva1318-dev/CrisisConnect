import Resource from "../models/resource.model.js";
import Request from "../models/request.model.js";
import User from "../models/user.models.js";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

console.log("Twilio SID:", process.env.TWILIO_SID ? "Loaded" : "MISSING");
console.log("Twilio Token:", process.env.TWILIO_AUTH_TOKEN ? "Loaded" : "MISSING");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// 1. Find Coordinators with resources near the incident
export const findNearestCoordinators = async (req, res) => {
    try {
        const { latitude, longitude, radius = 50 } = req.body;

        // Find resources within radius and group by Owner (Coordinator)
        const coordinators = await Resource.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                    distanceField: "distance",
                    maxDistance: radius * 1000, // Convert km to meters
                    spherical: true,
                    query: { status: "Available" } // Only available resources
                }
            },
            {
                $group: {
                    _id: "$owner",
                    resourceCount: { $sum: 1 },
                    nearestResourceDist: { $min: "$distance" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "details"
                }
            },
            { $unwind: "$details" },
            {
                $project: {
                    _id: 1,
                    name: "$details.name",
                    phone: "$details.phone",
                    email: "$details.email",
                    resourceCount: 1,
                    distanceKm: { $divide: ["$nearestResourceDist", 1000] }
                }
            },
            { $sort: { distanceKm: 1 } }
        ]);

        return res.status(200).json({ coordinators });
    } catch (error) {
        console.error("Find Coordinators Error:", error);
        return res.status(500).json({ message: "Error finding coordinators" });
    }
};

// 2. Create Request & Notify Coordinator (Agency -> Coordinator)
export const createRequest = async (req, res) => {
    try {
        const { coordinatorId, incidentId, resources } = req.body;
        const agencyId = req.userId; // From auth middleware

        // Create Request Record
        const newRequest = new Request({
            agencyId,
            coordinatorId,
            incidentId,
            resourcesRequested: resources,
            status: "Pending"
        });
        await newRequest.save();

        // Fetch Coordinator Phone to send SMS
        const coordinator = await User.findById(coordinatorId);

        // Send Twilio SMS to Coordinator
        if (coordinator?.phone) {
            try {
                await client.messages.create({
                    body: `🚨 ALERT: New Dispatch Request! An Agency needs ${resources.length} resource types. Log in to Coordinator Dashboard to Approve.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: coordinator.phone
                });
                console.log("SMS sent to Coordinator");
            } catch (smsErr) {
                console.error("Twilio Error:", smsErr.message);
            }
        }

        return res.status(201).json({ message: "Request sent successfully", request: newRequest });
    } catch (error) {
        console.error("Create Request Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 3. Coordinator Accepts/Rejects (Coordinator -> Agency)
export const updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // "Accepted" or "Rejected"

        const request = await Request.findById(requestId).populate("agencyId");
        if (!request) return res.status(404).json({ message: "Request not found" });

        request.status = status;
        await request.save();

        // Notify Agency via SMS
        const agency = request.agencyId;
        if (agency?.phone) {
            const msgBody = status === "Accepted"
                ? `✅ DISPATCH APPROVED: Coordinator has accepted your request for incident #${request.incidentId}. Resources are en route.`
                : `❌ DISPATCH DECLINED: Coordinator cannot fulfill your request for incident #${request.incidentId}.`;

            try {
                await client.messages.create({
                    body: msgBody,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: agency.phone
                });
            } catch (smsErr) {
                console.error("Twilio Error:", smsErr.message);
            }
        }

        return res.status(200).json({ message: `Request ${status}`, request });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};