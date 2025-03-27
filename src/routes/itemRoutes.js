import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Item from "../models/Item.js";
import protect from "../middleware/authMiddleware.js";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeValid = allowedTypes.test(file.mimetype);
    
    if (extValid && mimeValid) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed (jpeg, jpg, png, gif)"));
    }
  }
});

// Create new item
router.post("/", upload.single("image"), protect, async (req, res) => {
  try {
    const { name, description, price, category, status, location, collegeName } = req.body;
    const validColleges = ["SECT", "LTCE", "VJTI", "IITB", "SPIT", "TCOE"];

    // Validation
    if (!req.file) return res.status(400).json({ message: "Image is required" });
    if (!validColleges.includes(collegeName)) {
      return res.status(400).json({ message: "Invalid college name" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "lost-and-found",
    });

    const newItem = new Item({
      name,
      description,
      price: status === "Exchange" ? price : 0,
      category,
      status,
      location,
      collegeName,
      imageUrl: result.secure_url,
      owner: req.user.id
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to create item",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

// Get all items with optional college filter
router.get("/", async (req, res) => {
  try {
    const { college } = req.query;
    const query = college ? { collegeName: college } : {};
    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch items" });
  }
});

// Search items
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query required" });

    const items = await Item.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { collegeName: { $regex: query, $options: "i" } }
      ]
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

// Get single item
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    res.status(500).json({ message: "Failed to fetch item" });
  }
});

// Get user's items
router.get('/user/:userId', protect, async (req, res) => {
  try {
    // Verify the requested user matches the authenticated user
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const items = await Item.find({ owner: req.params.userId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update item
router.put("/:id", protect, upload.single("image"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let imageUrl = item.imageUrl;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        imageUrl,
        price: req.body.status === "Exchange" ? req.body.price : 0
      },
      { new: true }
    );

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to update item" });
  }
});

// Delete item
router.delete("/:itemId", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete image from Cloudinary
    if (item.imageUrl) {
      const publicId = item.imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`lost-and-found/${publicId}`);
    }

    await Item.findByIdAndDelete(req.params.itemId);
    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Delete item error:", error); // Add error logging
    res.status(500).json({ message: "Failed to delete item", error: error.message });
  }
});
export default router;