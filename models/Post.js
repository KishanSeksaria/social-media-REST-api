// Imports
import mongoose from "mongoose";

// Creating schema for user model
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      default: "",
      maxlength: 50,
    },
    pictures: {
      type: [String],
      default: [],
    },
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    comments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
      default: [],
    },
  },
  { timestamps: true }
);

// Creating post model using post schema
const Post = mongoose.model("Post", postSchema);

// Exports
export default Post;
