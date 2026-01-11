import express from "express";
import dotenv from "dotenv";
import ConnectDB from "./Db/Db.js";
import AuthRouter from "./routes/auth.routes.js";
import cors from "cors";
import UserRouter from "./routes/user.routes.js";
import crisisRoutes from "./routes/crisis.routes.js";
import cookieParser from "cookie-parser";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;



ConnectDB();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["*", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
})
)
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);

app.use("/api/crisis", crisisRoutes);





app.get("/", (req, res) => {
  res.send("API is running...");
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
