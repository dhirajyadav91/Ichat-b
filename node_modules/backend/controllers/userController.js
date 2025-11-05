// controllers/authController.js - FIXED VERSION
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ✅ REGISTER CONTROLLER
export const register = async (req, res) => {
  try {
    const { fullName, username, password, confirmPassword, gender } = req.body;

    if (!fullName || !username || !password || !confirmPassword || !gender) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Passwords do not match" 
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Username already exists, try a different one." 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Profile photos by gender
    const profilePhoto =
      gender === "male"
        ? `https://avatar.iran.liara.run/public/boy?username=${username}`
        : `https://avatar.iran.liara.run/public/girl?username=${username}`;

    await User.create({
      fullName,
      username,
      password: hashedPassword,
      profilePhoto,
      gender,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

// ✅ LOGIN CONTROLLER
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Incorrect username or password" 
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Incorrect username or password" 
      });
    }

    const tokenData = { userId: user._id };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });

    // ✅ Cookie setup
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        gender: user.gender,
      },
      token: token // ✅ Frontend ke liye bhi token bhejo
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

// ✅ LOGOUT CONTROLLER
export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({ 
      success: true,
      message: "Logged out successfully." 
    });
  } catch (error) {
    console.error("❌ Logout Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

// ✅ GET OTHER USERS - FIXED RESPONSE FORMAT
export const getOtherUsers = async (req, res) => {
  try {
    const loggedInUserId = req.id; // from middleware
    
    console.log("👥 GetOtherUsers - Logged in user ID:", loggedInUserId);

    // ✅ Find all users except current user
    const otherUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password -__v")
      .sort({ createdAt: -1 });

    console.log(`👥 Found ${otherUsers.length} other users in database`);

    // ✅ CORRECT RESPONSE FORMAT - Frontend expects { success: true, users: [] }
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users: otherUsers, // ✅ IMPORTANT: 'users' key mein array
      count: otherUsers.length
    });

  } catch (error) {
    console.error("❌ GetOtherUsers Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

// ✅ GET USER PROFILE
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.id; // from middleware
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("❌ GetUserProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};