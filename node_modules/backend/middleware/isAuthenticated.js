import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // 🔹 Token from cookie
    const token = req.cookies?.token;

    // 🔸 No token present
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Token not found.",
      });
    }

    // 🔹 Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 🔸 Invalid / expired token
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    // 🔹 Attach user ID to request for next middleware
    req.id = decoded.userId;

    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed. Invalid or expired token.",
    });
  }
};

export default isAuthenticated;
