import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    tokens: [{
      token: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d' // Optional: automatically expire tokens after 7 days
      }
    }],
    avatar: {
      type: String,
      default: 'default-avatar.jpg'
    },
    location: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }],
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }],
    ratings: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    tokens: [{
      token: {
        type: String,
        required: true
      }
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);
userSchema.methods.addToken = async function(token) {
  this.tokens = this.tokens.concat({ token });
  await this.save();
};

// Password Hashing before Saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password Compare Method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to add token to user
userSchema.methods.addToken = async function(token) {
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

// Create User Model
const User = mongoose.model("User", userSchema);
export default User;