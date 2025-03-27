import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Lost", "Found", "Exchange"],
    default: "Lost",
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  collegeName: {
    type: String,
    required: true,
    enum: ["SECT", "LTCE", "VJTI", "IITB", "SPIT","TCOE"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,  
  },
});

export default mongoose.model("Item", ItemSchema);
