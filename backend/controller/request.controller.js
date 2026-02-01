import Resource from "../models/resource.model.js";
import Request from "../models/request.model.js";
import User from "../models/user.models.js";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

console.log("Twilio SID:", process.env.TWILIO_SID ? "Loaded" : "MISSING");
console.log("Twilio Token:", process.env.TWILIO_AUTH_TOKEN ? "Loaded" : "MISSING");

const client = process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// 1. Find Coordinators with resources near the incident
export const findNearestCoordinators = async (req, res) => {
    try {
        const { latitude, longitude, radius = 50 } = req.body;

        const coordinators = await Resource.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                    distanceField: "distance",
                    maxDistance: radius * 1000,
                    spherical: true,
                    query: { status: "Available" }
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
        const agencyId = req.userId;

        const newRequest = new Request({
            agencyId,
            coordinatorId,
            incidentId,
            resourcesRequested: resources,
            status: "Pending"
        });
        await newRequest.save();

        const coordinator = await User.findById(coordinatorId);

        if (client && coordinator?.phone) {
            try {
                await client.messages.create({
                    body: `🚨 ALERT: New Dispatch Request! An Agency needs ${resources.length} resource types. Log in to Coordinator Dashboard to Approve.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: coordinator.phone
                });
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

export const updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const coordinatorId = req.userId;

        const request = await Request.findById(requestId).populate("agencyId");
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.status !== "Pending") {
            return res.status(400).json({ message: "Request already handled" });
        }

        // --- REJECTION LOGIC ---
        if (status === "Rejected") {
            request.status = "Rejected";
            await request.save();

            // Notify Agency
            if (client && request.agencyId?.phone) {
                try {
                    await client.messages.create({
                        body: `❌ Request Declined: Coordinator cannot fulfill request for Incident #${request.incidentId.toString().slice(-4)}.`,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: request.agencyId.phone
                    });
                } catch (e) { console.error("Twilio Error", e); }
            }
            return res.status(200).json({ message: "Request Rejected", request });
        }

        // --- ACCEPTANCE LOGIC (PARTIAL FULFILLMENT) ---
        if (status === "Accepted") {
            const requestedItems = request.resourcesRequested;
            const deployedLog = [];
            const failedLog = [];
            const remainingItems = [];

            for (const item of requestedItems) {
                // Find matching AVAILABLE resource
                const resource = await Resource.findOne({
                    owner: coordinatorId,
                    item_name: item.item_name,
                    status: "Available"
                });

                // Case 1: Resource Not Found or 0 Quantity
                if (!resource || resource.quantity <= 0) {
                    failedLog.push(`${item.quantity}x ${item.item_name}`);
                    remainingItems.push(item); // Keep in request
                    continue;
                }

                // Case 2: Partial or Full Deployment
                const quantityToDeploy = Math.min(resource.quantity, item.quantity);
                const quantityLeft = item.quantity - quantityToDeploy;

                // Deduct from Inventory
                resource.quantity -= quantityToDeploy;
                if (resource.quantity <= 0) {
                    await Resource.findByIdAndDelete(resource._id);
                } else {
                    await resource.save();
                }

                // Create Deployed Record
                await Resource.create({
                    owner: coordinatorId,
                    item_name: item.item_name,
                    category: item.category,
                    quantity: quantityToDeploy,
                    status: "Deployed",
                    current_incident: request.incidentId,
                    location: resource.location
                });

                // Log Success
                deployedLog.push(`${quantityToDeploy}x ${item.item_name}`);

                // If we couldn't fulfill strictly all of it, keep the remainder in the ticket
                if (quantityLeft > 0) {
                    item.quantity = quantityLeft;
                    remainingItems.push(item);
                    failedLog.push(`${quantityLeft}x ${item.item_name}`);
                }
            }

            // --- DATABASE UPDATE ---
            // If we deployed SOMETHING, we mark it accepted/processed.
            // We update 'resourcesRequested' to ONLY show what is still missing.
            request.status = "Accepted";
            request.resourcesRequested = remainingItems; // Update the ticket to show what's left
            await request.save();

            // --- SMART SMS NOTIFICATION ---
            const agency = request.agencyId;
            if (client && agency?.phone) {
                let msgBody = `Updates for Incident #${request.incidentId.toString().slice(-4)}:\n`;

                if (deployedLog.length > 0) {
                    msgBody += `✅ ON THE WAY: ${deployedLog.join(", ")}\n`;
                }

                if (failedLog.length > 0) {
                    msgBody += `⚠️ UNAVAILABLE (Try another Coord): ${failedLog.join(", ")}`;
                }

                if (deployedLog.length === 0 && failedLog.length > 0) {
                    msgBody = `❌ FAILED: Coordinator has NO inventory for: ${failedLog.join(", ")}`;
                }

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

            return res.status(200).json({
                message: "Request processed",
                deployed: deployedLog,
                remaining: remainingItems
            });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// 4. Get Pending Requests for Coordinator Dashboard
export const getCoordinatorRequests = async (req, res) => {
    try {
        const requests = await Request.find({
            coordinatorId: req.userId,
            status: "Pending"
        })
            .populate("agencyId", "name email phone")
            .populate("incidentId")
            .sort({ createdAt: -1 });

        return res.status(200).json({ requests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error fetching requests" });
    }
};

// 5. Get Request History for Agency Dashboard
export const getAgencyRequests = async (req, res) => {
    try {
        const requests = await Request.find({ agencyId: req.userId })
            .populate("coordinatorId", "name phone")
            .populate("incidentId", "type location")
            .sort({ createdAt: -1 });

        return res.status(200).json({ requests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error fetching history" });
    }
};