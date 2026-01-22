import { verifyToken } from "../utils/token.js";
import User from "../models/user.models.js";

const isAuth = async (req, res, next) => {
  try {
    // support cookie token (axios with credentials: true) OR Authorization header
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers?.authorization;
    let token = cookieToken;

    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: "Unauthorized" });

    req.userId = decoded.id;
    const user = await User.findById(req.userId).select("role").lean();
    req.userRole = user?.role || "citizen";

    next();
  } catch (error) {
    console.error("isAuth error:", error?.message || error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default isAuth;