// Imports and config
import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import authenticateUser from '../middlewares/authentication.js';
import { findPost, findUser } from '../middlewares/find.js';
import { deletePost } from '../extras/delete.js';
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

// Routes
// ROUTE 1: Login a user. POST '/api/authenticate'. No Login required.
router.post('/authenticate', async (req, res) => {
  const { user } = req.body;
  try {
    // Searching for existing user with the entered email
    const foundUser = await User.findOne({ email: user.email });

    // If no user exists with the entered email
    if (!foundUser) return res.status(404).json({ msg: 'Email not found.' });

    // If passwords don't match
    if (!(user.password === foundUser.password))
      return res.status(404).json({ msg: 'Wrong password.' });

    // Creating login authentication using jwt and sending that token to the client
    const authToken = jwt.sign(
      { userId: foundUser._id, isAdmin: foundUser.isAdmin },
      jwtSecret
    );
    res.status(200).json({ authToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 2: Follow user with provided id. POST '/api/follow/{id}'
router.post('/follow/:id', authenticateUser, findUser, async (req, res) => {
  // Extracting currentUser and foundUser(as userToBeFollowed) from req.body
  const { currentUser, foundUser: userToBeFollowed } = req.body;

  // If the user tries to follow themselves
  if (currentUser.equals(userToBeFollowed))
    return res.status(404).json({ msg: 'You cannot follow yourself.' });

  // Checking if already following the requested user
  if (currentUser.following.includes(userToBeFollowed._id))
    return res
      .status(404)
      .json({ msg: 'Already following the requested user.' });

  try {
    // Updating the users to include follow details
    await currentUser.updateOne({ $push: { following: userToBeFollowed._id } });
    await userToBeFollowed.updateOne({ $push: { followers: currentUser._id } });

    // Responding after the job is done
    res.status(200).json({ msg: 'User followed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 3: Unfollow user with provided id. POST '/api/follow/{id}'
router.post('/unfollow/:id', authenticateUser, findUser, async (req, res) => {
  // Extracting currentUser and foundUser(as userToBeUnfollowed) from req.body
  const { currentUser, foundUser: userToBeUnfollowed } = req.body;

  // If the user tries to unfollow themselves
  if (currentUser.equals(userToBeUnfollowed))
    return res.status(404).json({ msg: 'You cannot unfollow yourself.' });

  // Checking if already not following the requested user
  if (!currentUser.following.includes(userToBeUnfollowed._id))
    return res
      .status(404)
      .json({ msg: 'Already not following the requested user.' });

  try {
    // Updating the users to remove follow details
    await currentUser.updateOne({
      $pull: { following: userToBeUnfollowed._id },
    });
    await userToBeUnfollowed.updateOne({
      $pull: { followers: currentUser._id },
    });

    // Responding after the job is done
    res.status(200).json({ msg: 'User unfollowed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 4: Return profile of authenticated user. GET '/api/user'
router.get('/user', authenticateUser, async (req, res) => {
  // Extracting foundUser from req.body
  const { currentUser } = req.body;

  // If found, take everything except password and send to the client
  const { password, ...others } = currentUser._doc;

  // Sending details of foundUser except password to the client
  res.status(200).json(others);
});

// ROUTE 5: Create a new post. POST '/api/posts/'
router.post('/posts', authenticateUser, async (req, res) => {
  // Extracting currentUser and post(details to create the post) from req.body
  const { currentUser, post } = req.body;

  // If user tries to send an empty post
  if (!post.title || !post.description)
    return res
      .status(400)
      .json({ msg: 'You need at a title and a description.' });

  try {
    // Creating the new post
    const newPost = await Post.create({
      user: currentUser._id,
      ...post,
    });

    // Updating the user to add post to their profile/account
    await currentUser.updateOne({ $push: { posts: newPost._id } });

    // Responding with the appropriate message
    res.status(200).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 6: Delete post with the provided id. DELETE '/api/posts/{id}'
router.delete('/posts/:id', authenticateUser, findPost, async (req, res) => {
  // Extracting currentUser and foundPost from req.body
  const { currentUser, foundPost } = req.body;

  // If user does not own the post, and is not any admin
  if (!currentUser._id.equals(foundPost.user) && !currentUser.isAdmin)
    return res.status(404).json({ msg: 'You can only delete your posts.' });

  try {
    // Deleting the post
    await deletePost(foundPost);

    // Responding after successful deletion
    res.status(200).json({ msg: 'Post deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 7: Like post with provided id. POST '/api/like/{id}'
router.post('/like/:id', authenticateUser, findPost, async (req, res) => {
  // Extracting currentUser and foundPost from req. body
  const { currentUser, foundPost } = req.body;

  try {
    // If the user already likes the post, remove the like, else like it
    if (foundPost.likes.includes(currentUser._id)) {
      await foundPost.updateOne({ $pull: { likes: currentUser._id } });
      res.status(200).json({ msg: 'Removed like successfully.' });
    } else {
      await foundPost.updateOne({ $push: { likes: currentUser._id } });

      // If the user already unlikes the post, remove that unline since they now like the post
      // Cannot like and unlike at the same time
      if (foundPost.unlikes.includes(currentUser._id))
        await foundPost.updateOne({ $pull: { unlikes: currentUser._id } });

      res.status(200).json({ msg: 'Post liked successfully.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 8: Unlike post with provided id. POST '/api/unlike/{id}'
router.post('/unlike/:id', authenticateUser, findPost, async (req, res) => {
  // Extracting currentUser and foundPost from req. body
  const { currentUser, foundPost } = req.body;

  try {
    // If the user already unlikes the post, remove the unlike, else unlike it
    if (foundPost.unlikes.includes(currentUser._id)) {
      await foundPost.updateOne({ $pull: { unlikes: currentUser._id } });
      res.status(200).json({ msg: 'Removed unlike successfully.' });
    } else {
      await foundPost.updateOne({ $push: { unlikes: currentUser._id } });

      // If the user already likes the post, remove that line since they now unlike the post
      // Cannot like and unlike at the same time
      if (foundPost.likes.includes(currentUser._id))
        await foundPost.updateOne({ $pull: { likes: currentUser._id } });

      res.status(200).json({ msg: 'Post unliked successfully.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 9: COmment on the post wiht the provided id. POST '/api/comment/{id}'
router.post('/comment/:id', authenticateUser, findPost, async (req, res) => {
  // Extracting currentUser, foundPost and comment from req.body
  const { comment, currentUser, foundPost } = req.body;

  // If user tries to send an empty comment
  if (!comment)
    return res.status(401).json({ msg: 'Cannot send an empty comment.' });

  try {
    // Creating a new comment
    const newComment = await Comment.create({
      by: currentUser._id,
      forPost: foundPost._id,
      comment,
    });

    // Adding the newly created comment to the post
    await foundPost.updateOne({ $push: { comments: newComment._id } });

    // Responding with success message
    res.status(200).json(newComment._id);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 10: All posts created by aithenticated user. GET '/api/posts/all_posts'
router.get('/posts/all_posts', authenticateUser, async (req, res) => {
  // Extracting the current user from req.body
  const { currentUser } = req.body;

  try {
    // Searching for all posts of the current user
    const posts = await Post.find({
      user: currentUser._id,
    });

    // Sorting posts from latest to oldest
    const timelinePosts = posts.sort((a, b) => b.createdAt - a.createdAt);

    // Returning the timiline posts
    res.status(200).json({ timelinePosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 11: Get a post with the provided id. GET '/api/posts/{id}'
router.get('/posts/:id', findPost, async (req, res) => {
  // Extracting foundPost as post from req.body
  const { foundPost: post } = req.body;

  // If post found, send it
  res.status(200).json({ post });
});

// Exports
export default router;
