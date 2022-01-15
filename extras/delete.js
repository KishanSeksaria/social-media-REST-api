// Imports
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

// Methods
const deleteUser = async (userToBeDeleted) => {
  try {
    // We need to delete all the posts of the user first
    userToBeDeleted.posts?.forEach(async (post) => {
      // This will delete posts with all the comments as well
      await deletePost(await Post.findById(post));
    });

    // After this, we need to remove the user from the followers and followings of other users
    // Removing the user from the follow list of the users following the user currently
    userToBeDeleted.followers?.forEach(async (follower) => {
      await User.findByIdAndUpdate(follower, {
        $pull: { following: userToBeDeleted._id },
      });
    });

    // Removing the user from the followers of the users the user is following currently
    userToBeDeleted.following?.forEach(async (follow) => {
      await User.findByIdAndUpdate(follow, {
        $pull: { followers: userToBeDeleted._id },
      });
    });

    // We need to delete all the comments made by the user as well
    (await Comment.find({ by: userToBeDeleted._id })).forEach(
      async (comment) => {
        await deleteComment(await Comment.findById(comment));
      }
    );

    // After all the things are done, we finally delete the user
    return await userToBeDeleted.delete();
  } catch (err) {
    throw err;
  }
};

const deletePost = async (postToBeDeleted) => {
  try {
    // We need to delete all the comments on the post first
    postToBeDeleted.comments?.forEach(async (comment) => {
      await deleteComment(await Comment.findById(comment));
    });

    console.log(postToBeDeleted.user);

    // Before deleting the post, we need to remove it from the user it belonged to
    await User.findByIdAndUpdate(postToBeDeleted.user, {
      $pull: { posts: postToBeDeleted._id },
    });

    // After all the things are done, we finally delete the post
    return await postToBeDeleted.delete();
  } catch (err) {
    throw err;
  }
};

const deleteComment = async (commentToBeDeleted) => {
  try {
    // We need to delete all the replies to this comment first
    commentToBeDeleted.replies?.forEach(async (reply) => {
      await Comment.findByIdAndDelete(reply);
    });

    // Before deleting the comment, we need to remove it from the post it is in
    await Post.findByIdAndUpdate(commentToBeDeleted.forPost, {
      $pull: { comments: commentToBeDeleted._id },
    });

    // After all the replies are deleted, we finally delete the comment
    return await commentToBeDeleted.delete();
  } catch (err) {
    throw err;
  }
};

export { deleteComment, deletePost, deleteUser };
