// Imports and config
import express from "express";
const router = express.Router();
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { isLoggedIn } from "../middlewares/authentication.js";
import { deletePost } from "../extras/delete.js";
import { findPost, findUser } from "../middlewares/find.js";

// Routes
// Route 1: Create a post. POST '/api/posts'. Login required.
router.post("/", isLoggedIn, async (req, res) => {
  // Extracting currentUser and post(details to create the post) from req
  const {
    user: currentUser,
    body: { post },
  } = req;

  // If user tries to send an empty post
  if (!post.caption && !post.pictures)
    return res
      .status(400)
      .json({ msg: "You need at least a caption or an image." });

  try {
    // Creating the new post
    const newPost = await Post.create({
      user: currentUser._id,
      ...post,
    });

    // Updating the user to add post to their profile/account
    await currentUser.updateOne({ $push: { posts: newPost._id } });

    // Responding with the appropriate message
    res.status(200).json({ msg: "Post created successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// Route 2: Get all timeline posts. GET '/api/posts'. Login required.
router.get("/", isLoggedIn, async (req, res) => {
  // Extracting the current user from req
  const { user: currentUser } = req;

  try {
    // Searching for all posts
    const posts = await Post.find();

    // Filtering all posts for those which are from the user or from their followings, and then sort from latest to oldest
    const timelinePosts = posts
      .filter((post) => {
        return (
          currentUser.equals(post.user) ||
          currentUser.following.includes(post.user)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    // Returning the timiline posts
    res.status(200).json({ timelinePosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// Route 3: Get a post. GET '/api/posts/:postId'. Login required.
router.get("/:postId", isLoggedIn, findPost, async (req, res) => {
  // Extracting foundPost as post from req.body
  const { foundPost: post } = req;

  // If post found, send it
  res.status(200).json({ post });
});

// Route 4: Update a post. PUT '/api/posts/:postId'. Login required.
router.put("/:postId", isLoggedIn, findUser, findPost, async (req, res) => {
  // Extracting currentUser, foundPost and updatedPost(data to be updated) from req
  const {
    foundPost,
    user: currentUser,
    body: { updatedPost },
  } = req;

  if (!updatedPost)
    return res.status(404).json({
      msg: "You cannot delete your post here. Use delete method for that",
    });

  // If user does not own the post, and is not any admin
  if (!currentUser._id.equals(foundPost.user) && !currentUser.isAdmin)
    return res.status(404).json({ msg: "You can only update your posts." });

  try {
    // Updating the post
    await foundPost.updateOne({ $set: updatedPost });

    // Responding after successful updation
    res.status(200).json({ msg: "Post updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// Route 5: Delete a post. DELETE '/api/posts/:postId'. Login required.
router.delete("/:postId", isLoggedIn, findPost, async (req, res) => {
  // Extracting currentUser and foundPost from req
  const { user: currentUser, foundPost } = req;

  // If user does not own the post, and is not any admin
  if (!currentUser._id.equals(foundPost.user) && !currentUser.isAdmin)
    return res.status(404).json({ msg: "You can only delete your posts." });

  try {
    // Deleting the post
    await deletePost(foundPost);

    // Responding after successful deletion
    res.status(200).json({ msg: "Post deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// Route 6: Like/Dislike a post. POST '/api/posts/:postId/like'. Login required.
router.post("/:postId/like", isLoggedIn, findPost, async (req, res) => {
  // Extracting currentUser and foundPost from req. body
  const { user: currentUser, foundPost } = req;

  try {
    // If the user already likes the post, remove the like, else like it
    if (foundPost.likes.includes(currentUser._id)) {
      await foundPost.updateOne({ $pull: { likes: currentUser._id } });
      res.status(200).json({ msg: "Post unliked successfully." });
    } else {
      await foundPost.updateOne({ $push: { likes: currentUser._id } });
      res.status(200).json({ msg: "Post liked successfully." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// Route 7: Comment on a post. POST '/api/posts/:postId/comment'. Login required.
router.post("/:postId/comment", isLoggedIn, findPost, async (req, res) => {
  // Extracting currentUser, foundPost and comment from req.body
  const {
    user: currentUser,
    foundPost,
    body: { comment },
  } = req;

  // If user tries to send an empty comment
  if (!comment)
    return res.status(401).json({ msg: "Cannot send an empty comment." });

  try {
    // Creating a new comment
    const newComment = await Comment.create({
      by: currentUser._id,
      forPost: foundPost._id,
      content: comment,
    });

    // Adding the newly created comment to the post
    await foundPost.updateOne({ $push: { comments: newComment._id } });

    // Responding with success message
    res.status(200).json({ msg: "Comment Successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// Exports
export default router;
