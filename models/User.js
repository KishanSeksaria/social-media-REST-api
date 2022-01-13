// Imports
import mongoose from "mongoose";

// Creating schema for user model
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    followers: {
      type: Array,
      default: [],
    },
    following: {
      type: Array,
      default: [],
    },
    bio: {
      type: String,
      maxlength: 50,
    },
    currentCity: {
      type: String,
      maxlength: 20,
    },
    hometown: {
      type: String,
      maxlength: 20,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Creating user model using user schema
const User = mongoose.model("User", userSchema);

// Exports
export default User;
