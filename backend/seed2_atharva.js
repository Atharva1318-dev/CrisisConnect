import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.models.js";
import Resource from "./models/resource.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;

const addAtharvaResources = async () => {
    try {
        // 1. Connect to Database
        if (!MONGO_URI) {
            throw new Error("❌ MONGO_URI is missing in .env file");
        }
        await mongoose.connect(MONGO_URI);
        console.log("🔌 Connected to DB...");

        // 2. Find Coordinator Atharva
        // We search by the specific coordinator email from your user list
        const targetEmail = "aj2@gmail.com";
        const coordinator = await User.findOne({ email: targetEmail });

        if (!coordinator) {
            console.error(`❌ Error: User ${targetEmail} not found!`);
            console.log("   Please ensure users are seeded first.");
            process.exit(1);
        }

        console.log(`✅ Found Coordinator: ${coordinator.name} (${coordinator._id})`);

        // 3. Define Mumbai-Specific Resources
        // Locations: Dadar, CST, Dharavi, Ghatkopar, Kurla
        const newResources = [
            {
                item_name: "BEST Mini Bus (Evacuation)",
                quantity: 2,
                category: "Rescue",
                status: "Available",
                location: { type: "Point", coordinates: [72.8432, 19.0178] }, // Dadar
                owner: coordinator._id,
            },
            {
                item_name: "Food Packets (Vada Pav & Water)",
                quantity: 500,
                category: "Food",
                status: "Deployed", // Blue Badge (Active Field Work)
                location: { type: "Point", coordinates: [72.8347, 18.9415] }, // CST Area
                owner: coordinator._id,
            },
            {
                item_name: "Tarpaulin Sheets (Monsoon Shelter)",
                quantity: 100,
                category: "Shelter",
                status: "Available",
                location: { type: "Point", coordinates: [72.8561, 19.0390] }, // Dharavi/Sion
                owner: coordinator._id,
            },
            {
                item_name: "Basic First Aid Kits (Generic)",
                quantity: 50,
                category: "Medical",
                status: "Maintenance", // Orange Badge
                location: { type: "Point", coordinates: [72.9080, 19.0860] }, // Ghatkopar
                owner: coordinator._id,
            },
            {
                item_name: "Local Youth Volunteer Group",
                quantity: 15,
                category: "Rescue",
                status: "Reserved", // Red Alert (Pending Request)
                location: { type: "Point", coordinates: [72.8800, 19.0650] }, // Kurla
                owner: coordinator._id,
            },
        ];

        // 4. Insert Data (Append Only)
        console.log("📦 Adding Atharva's resources...");
        const created = await Resource.insertMany(newResources);

        console.log(`\n🎉 Success! Added ${created.length} new resources to Atharva's inventory.`);
        console.log("---------------------------------------------------");
        created.forEach((r) => {
            console.log(`   - [${r.status}] ${r.item_name} (${r.category})`);
        });
        console.log("---------------------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error adding resources:", error);
        process.exit(1);
    }
};

addAtharvaResources();