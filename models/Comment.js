// Imports
import mongoose from 'mongoose';

// Creating schema for user model
const commentSchema = new mongoose.Schema(
  {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    forPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 50,
    },
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    replies: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
      default: [],
    },
  },
  { timestamps: true }
);

// Creating comment model using comment schema
const Comment = mongoose.model('Comment', commentSchema);

// Exports
export default Comment;
