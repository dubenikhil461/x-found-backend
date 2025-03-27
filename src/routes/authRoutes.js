import express from "express";
import {
  registerUser,
  login,
  resetPassword,
  forgotPassword,
} from "../controllers/authController.js";

const router = express.Router();

// POST: /api/auth/signup
router.post("/signup", registerUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
