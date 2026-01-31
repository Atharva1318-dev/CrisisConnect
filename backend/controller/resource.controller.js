import Resource from "../models/resource.model.js";
import User from "../models/user.models.js";       // 👈 Added
import Incident from "../models/incident.model.js"; // 👈 Added

// Create a new resource
export const createResource = async (req, res) => {
    try {
        const { item_name, quantity, category, latitude, longitude, status } = req.body;

        let owner = req.userId; // Default: Owner is the creator (Agency)
        let current_incident = null;

        // 🔥 SMART FIX: If this is a Dispatch Request (Status: Reserved)
        if (status === "Reserved") {
            // 1. Re-assign Owner: The Agency created it, but YOU (Coordinator) need to see it.
            // We find the first Coordinator in the DB to assign this request to.
            const coordinator = await User.findOne({ role: "coordinator" });
            if (coordinator) {
                owner = coordinator._id;
                console.log(`🔀 Request auto-assigned to Coordinator: ${coordinator.name}`);
            }

            // 2. Auto-Link Incident: Find the active incident at this location
            // This ensures the request gets grouped correctly on your dashboard
            if (latitude && longitude) {
                const incident = await Incident.findOne({
                    "location.coordinates": [Number(longitude), Number(latitude)],
                    status: { $in: ["Pending", "Active"] }
                });

                if (incident) {
                    current_incident = incident._id;
                    console.log(`🔗 Linked to Incident: ${incident.type}`);
                }
            }
        }

        const newResource = new Resource({
            item_name,
            quantity,
            category,
            location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
            status: status || "Available",
            owner: owner, // 👈 Saved with Coordinator as owner
            current_incident: current_incident // 👈 Saved with Incident Link
        });

        await newResource.save();
        return res.status(201).json({ message: "Resource added successfully", resource: newResource });
    } catch (error) {
        console.error("Create Resource Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get resources (Updated to populate incident details for grouping)
// controller/resource.controller.js

export const getMyResources = async (req, res) => {
    try {
        // Fetch items that are MINE or RESERVED (Global Requests)
        const resources = await Resource.find({
            $or: [
                { owner: req.userId },
                { status: "Reserved" }
            ]
        })
            .sort({ createdAt: -1 })
            // 1. Get the Name of the Coordinator (Owner)
            .populate("owner", "name email")
            // 2. Get the Incident details AND the Agency who reported it
            .populate({
                path: "current_incident",
                populate: { path: "reportedBy", select: "name email role" }
            });

        return res.status(200).json({ resources });
    } catch (error) {
        console.error("Get Resources Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update a resource
export const updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Handle location update
        if (updateData.latitude && updateData.longitude) {
            updateData.location = {
                type: "Point",
                coordinates: [Number(updateData.longitude), Number(updateData.latitude)]
            };
            delete updateData.latitude;
            delete updateData.longitude;
        }

        // 1. Find the resource purely by ID first (ignore owner check initially)
        const resource = await Resource.findById(id);

        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        // 2. 🔥 PERMISSION CHECK:
        // Allow the update ONLY if:
        //   A) You are the actual owner
        //   B) OR The resource is a "Reserved" request (meaning it's a dispatch order anyone can fulfill)
        if (resource.owner.toString() !== req.userId && resource.status !== 'Reserved') {
            return res.status(403).json({ message: "Unauthorized: You do not own this resource" });
        }

        // 3. Perform the update
        const updatedResource = await Resource.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return res.status(200).json({ message: "Resource updated", resource: updatedResource });
    } catch (error) {
        console.error("Update Resource Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Resource.findOneAndDelete({ _id: id, owner: req.userId });
        if (!deleted) return res.status(404).json({ message: "Resource not found or unauthorized" });
        return res.status(200).json({ message: "Resource deleted" });
    } catch (error) { return res.status(500).json({ message: "Internal server error" }); }
};

export const getAvailableResourcesGrouped = async (req, res) => {
    try {
        const resources = await Resource.aggregate([
            { $match: { status: "Available" } },
            { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "ownerDetails" } },
            { $unwind: "$ownerDetails" },
            { $group: { _id: "$owner", ownerName: { $first: "$ownerDetails.name" }, ownerEmail: { $first: "$ownerDetails.email" }, resources: { $push: "$$ROOT" } } }
        ]);
        return res.status(200).json({ groupedResources: resources });
    } catch (error) { return res.status(500).json({ message: "Internal server error" }); }
};