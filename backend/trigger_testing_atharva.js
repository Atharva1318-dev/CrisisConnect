import mongoose from "mongoose";
import dotenv from "dotenv";
import Resource from "./models/resource.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;

const triggerAlert = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("🔌 Connected to DB...");

        // 🎯 TARGET: Rishabh's specific Ambulance
        // Make sure this matches the item name in your DB exactly
        const targetName = "ICU Ambulance Unit - Beta";

        const resource = await Resource.findOne({ item_name: targetName });

        if (!resource) {
            console.log(`❌ Error: Could not find '${targetName}'.`);
            process.exit(1);
        }

        // 🔥 ACTION: Set status to 'Reserved' (Simulates an incoming dispatch order)
        resource.status = "Reserved";
        await resource.save();

        console.log(`\n🚨 ALERT TRIGGERED! 🚨`);
        console.log(`-----------------------------------`);
        console.log(`Resource: ${resource.item_name}`);
        console.log(`New Status: RESERVED (Dispatch Requested)`);
        console.log(`-----------------------------------`);
        console.log(`👉 Go to your Coordinator Dashboard NOW.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

triggerAlert();