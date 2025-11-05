import { Conversation } from "../models/conversationModel.js";
import { Message } from "../models/messageModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// ✅ Send Message Controller
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id; // Comes from JWT middleware
    const receiverId = req.params.id;
    const { message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // Create new message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    // Push message to conversation
    conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    // ✅ Real-time socket message emit
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    console.error("❌ sendMessage Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get All Messages Between Two Users
export const getMessage = async (req, res) => {
  try {
    const senderId = req.id; // from auth middleware
    const receiverId = req.params.id;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    if (!conversation) {
      return res.status(200).json([]); // No messages yet
    }

    return res.status(200).json(conversation.messages);
  } catch (error) {
    console.error("❌ getMessage Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
