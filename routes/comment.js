// Imports and config
import express from "express";
import authenticateUser from "../middlewares/authentication.js";
import Comment from "../models/Comment.js";
import { deleteComment } from "../extras/delete.js";
import { findComment, findUser } from "../middlewares/find.js";
const router = express.Router();

// Routes
// Route 1: Get a comment. GET '/api/comments/:commentId'. Login required.
router.get("/:commentId", authenticateUser, findComment, async (req, res) => {
  // Extracting foundComment from req.body
  const { foundComment } = req.body;

  // If comment found, return it
  res.status(200).json({ foundComment });
});

// Route 2: Edit a comment. PUT '/api/comments/:commentId'. Login required.
router.put(
  "/:commentId",
  authenticateUser,
  findUser,
  findComment,
  async (req, res) => {
    // Extracting currentUser and foundComment from req.body
    const { currentUser, foundComment, updatedComment } = req.body;

    // If the user tries to clear the comment
    if (!updatedComment)
      return res
        .status(401)
        .json({ msg: "Cannot clear a comment. Use delete method for this." });

    // If the user does not own the comment
    if (!currentUser._id.equals(foundComment.by))
      return res
        .status(200)
        .json({ msg: "You can only edit your own comment." });

    try {
      // Updating the comment
      await foundComment.updateOne({ $set: { content: updatedComment } });

      // responding after successful updation
      res.status(200).json({ msg: "Comment updated Successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Internal server error." });
    }
  }
);

// Route 3: Delete a comment. DELETE '/api/comments/:commentId'. Login required.
router.delete(
  "/:commentId",
  authenticateUser,
  findUser,
  findComment,
  async (req, res) => {
    // Extracting currentUser and foundComment from req.body
    const { currentUser, foundComment } = req.body;

    // If the user does not own the comment, and is not an admin
    if (!currentUser._id.equals(foundComment.by) && !auth.isAdmin)
      return res.status(200).json({ msg: "Unauthorized." });

    try {
      // Deleting the comment
      await deleteComment(foundComment);

      // responding after successful deletion
      res.status(200).json({ msg: "Comment deleted Successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Internal server error." });
    }
  }
);

// Route 4: Like a comment. POST '/api/comments/:commentId/like'. Login required.
router.post(
  "/:commentId/like",
  authenticateUser,
  findUser,
  findComment,
  async (req, res) => {
    // Extracting currentUser and foundComment from req.body
    const { currentUser, foundComment } = req.body;

    try {
      // If the user already likes the comment, unlike it, else like it
      if (foundComment.likes.includes(currentUser._id)) {
        await Comment.updateOne({ $pull: { likes: currentUser._id } });
        res.status(200).json({ msg: "Unliked the comment successfully." });
      } else {
        await Comment.updateOne({ $push: { likes: currentUser._id } });
        res.status(200).json({ msg: "Liked the comment successfully." });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Internal server error." });
    }
  }
);

// Route 5: Reply to a comment. POST '/api/comments/:commentId/reply'. Login required.
router.post(
  "/:commentId/reply",
  authenticateUser,
  findUser,
  findComment,
  async (req, res) => {
    // Extracting currentUser, foundComment and comment(reply to be added) from req.body
    const { comment, currentUser, foundComment } = req.body;

    // If user tries to send an empty comment
    if (!comment)
      return res.status(401).json({ msg: "Cannot send an empty comment." });

    try {
      // Creating a new comment
      const newComment = await Comment.create({
        by: currentUser._id,
        forPost: foundComment.forPost,
        content: comment,
      });

      // Adding the newly created comment to the post
      await foundComment.updateOne({ $push: { replies: newComment._id } });

      // Responding with success message
      res.status(200).json({ msg: "Comment Successful." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Internal Server Error." });
    }
  }
);

// Exports
export default router;
