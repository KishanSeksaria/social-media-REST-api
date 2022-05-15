// Imports
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

// Methods
// If there is any parameter for userId, which means, if we need to find a user using request parameters, this middleware finds it and adds it to req.body as 'foundUser'
const findUser = async (req, res, next) => {
  const { id: userId } = req.params;
  try {
    if (userId) {
      // Searching for the current user
      const foundUser = await User.findById(userId);

      // If user not found
      if (!foundUser) return res.status(404).json({ msg: 'User not found' });

      // Adding founduser to request object body
      req.body.foundUser = foundUser;
    }

    // Calling the next method
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
};

// If there is any parameter for postId, which means, if we need to find a post using request parameters, this middleware finds it and adds it to req.body as 'foundPost'
const findPost = async (req, res, next) => {
  const { id: postId } = req.params;
  try {
    if (postId) {
      // Searching for the post
      const post = await Post.findById(postId);

      // If no post found
      if (!post) return res.status(404).json({ msg: 'Post not found' });

      // Adding post to request object body
      req.body.foundPost = post;
    }

    // Calling the next method
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
};

// If there is any parameter for commentId, which means, if we need to find a comment using request parameters, this middleware finds it and adds it to req.body as 'foundComment'
const findComment = async (req, res, next) => {
  const { id: commentId } = req.params;
  try {
    if (commentId) {
      // Searching for the comment
      const comment = await Comment.findById(commentId);

      // If no comment found
      if (!comment) return res.status(404).json({ msg: 'Comment not found' });

      // Adding comment to request object body
      req.body.foundComment = comment;
    }

    // Calling the next method
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
};

// Exports
export { findComment, findPost, findUser };
