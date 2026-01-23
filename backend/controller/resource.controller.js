import Resource from "../models/resource.model.js";

// Create a new resource
export const createResource = async (req, res) => {
    try {
        const { item_name, quantity, category, latitude, longitude, status } = req.body;

        const newResource = new Resource({
            item_name,
            quantity,
            category,
            location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
            status: status || "Available",
            owner: req.userId // From isAuth middleware
        });

        await newResource.save();
        return res.status(201).json({ message: "Resource added successfully", resource: newResource });
    } catch (error) {
        console.error("Create Resource Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get resources belonging to the logged-in Coordinator
export const getMyResources = async (req, res) => {
    try {
        const resources = await Resource.find({ owner: req.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ resources });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update a resource
export const updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Handle location update specifically if present
        if (updateData.latitude && updateData.longitude) {
            updateData.location = {
                type: "Point",
                coordinates: [Number(updateData.longitude), Number(updateData.latitude)]
            };
            delete updateData.latitude;
            delete updateData.longitude;
        }

        const updatedResource = await Resource.findOneAndUpdate(
            { _id: id, owner: req.userId }, // Ensure ownership
            updateData,
            { new: true }
        );

        if (!updatedResource) return res.status(404).json({ message: "Resource not found or unauthorized" });

        return res.status(200).json({ message: "Resource updated", resource: updatedResource });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a resource
export const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Resource.findOneAndDelete({ _id: id, owner: req.userId });

        if (!deleted) return res.status(404).json({ message: "Resource not found or unauthorized" });

        return res.status(200).json({ message: "Resource deleted" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};