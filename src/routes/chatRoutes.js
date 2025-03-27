import express from "express";
import Chat from "../models/Message.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Create or get existing chat
router.post("/", protect, async (req, res) => {
  try {
    const { itemId, participants } = req.body;

    // Check if chat already exists
    let chat = await Chat.findOne({
      item: itemId,
      participants: { $all: participants },
    });

    if (!chat) {
      chat = new Chat({
        item: itemId,
        participants,
        messages: [],
      });
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error creating chat" });
  }
});

// Get user's chats
router.get("/user", protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
    })
      .populate("item")
      .populate("participants");

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats" });
  }
});

export default router;
