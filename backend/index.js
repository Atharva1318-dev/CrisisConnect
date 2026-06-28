import express from "express";
import dotenv from "dotenv";
import ConnectDB from "./Db/Db.js";
import AuthRouter from "./routes/auth.routes.js";
import cors from "cors";
import UserRouter from "./routes/user.routes.js";
import IncidentRouter from "./routes/incident.routes.js";
import cookieParser from "cookie-parser";
import NewsRouter from "./routes/new.routes.js";
import ResourceRouter from "./routes/resource.routes.js";

import WhatsAppRouter from "./routes/whatsapp.routes.js";
import RequestRouter from "./routes/request.routes.js";
import TelegramRouter from "./routes/telegram.routes.js";
import { startBot } from "./controller/telegram.controller.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT 

ConnectDB();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser({ limit: "50mb", extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://codeathon-38z5.onrender.com",
      "http://192.168.31.166:5173",
       
      "http://192.168.31.166:8901",
      "https://codeathon-38z5.onrender.com"

    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "✅ WhatsApp SOS Service Running",
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime()
  });
});
// ROUTES
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/news", NewsRouter);
app.use("/api/incident", IncidentRouter);
app.use("/api/resource", ResourceRouter);
app.use("/api/whatsapp", WhatsAppRouter);
app.use("/api/request", RequestRouter);
app.use("/api/telegram", TelegramRouter);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start Telegram Bot
  startBot();
});
