// Imports and config
import express from "express";
const router = express.Router();
import User from "../models/User.js";
import bcrypt from "bcrypt";
import authenticateUser from "../middlewares/authentication.js";

// Routes
// ROUTE 1: Get a user. GET 'api/users/:userId'. No Login required.
router.get("/:userId", async (req, res) => {
  try {
    // Searching for the user with the id
    const foundUser = await User.findById(req.params.userId);

    // If no such user exists, respond accordingly
    if (!foundUser) return res.status(404).json({ msg: "No user found." });

    // If found, take everything except password and send to the client
    const { password, ...others } = foundUser._doc;
    res.status(200).json(others);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error." });
  }
});

// ROUTE 2: Update a user. PUT '/api/users/:userId'. Login required.
router.put("/:userId", authenticateUser, async (req, res) => {
  const { user, auth } = req.body;
  try {
    // If user is not the current user or an admin, respond unauthorized
    if (auth.userId !== req.params.userId && !auth.isAdmin)
      return res.status(400).json({ msg: "Unauthorized." });

    // If user tries to update password, hash it again
    if (user.password) {
      user.password = await bcrypt.hash(
        user.password,
        await bcrypt.genSalt(10)
      );
    }

    // Finally update the user with the fields entered by the user and send it as response
    const updatedUser = await User.findByIdAndUpdate(req.params.userId, {
      $set: user,
    });
    res.status(200).json({ msg: "User successfully updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error." });
  }
});

// ROUTE 3: Delete a user. DELETE 'api/users/:userId'. Login required.
router.delete("/:userId", authenticateUser, async (req, res) => {
  const { auth } = req.body;
  try {
    // If user is not the current user or an admin, respond unauthorized
    if (auth.userId !== req.params.userId && !auth.isAdmin)
      return res.status(400).json({ msg: "Unauthorized." });

    // If user not found, or not deleted
    if (!(await User.findByIdAndDelete(req.params.userId)))
      return res.status(404).json({ msg: "User not found." });

    // If user deleted successfully, respond with a confirmation message
    return res.status(200).json({ msg: "User successfully deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error." });
  }
});

// ROUTE 4: Follow a user. POST 'api/users/:userId/follow'. Login required.
// The parameter 'userId' is for the user to be followed and we can obtain the current logged in user id fron the jsonwebtoken
router.post("/:userId/follow", authenticateUser, async (req, res) => {
  const { auth } = req.body;
  if (auth.userId === req.params.userId)
    return res.status(404).json({ msg: "You cannot follow yourself." });

  try {
    // Finding the user to be followed
    const userToBeFollowed = await User.findById(req.params.userId);

    // If user to be followed is not found
    if (!userToBeFollowed)
      return res.status(404).json({ msg: "User not found." });

    // Finding the current user
    const currentUser = await User.findById(auth.userId);

    // If current user is not found
    if (!currentUser) return res.status(404).json({ msg: "User not found." });

    // Checking if already following the requested user
    if (currentUser.following.includes(userToBeFollowed._id))
      return res
        .status(404)
        .json({ msg: "Already following the requested user." });

    // Updating the users to include follow details
    await currentUser.updateOne({ $push: { following: userToBeFollowed._id } });
    await userToBeFollowed.updateOne({ $push: { followers: currentUser._id } });

    // Responding after the job is done
    res.status(200).json({ msg: "User followed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error." });
  }
});

// ROUTE 5 Unfollow a user. POST 'api/users/:userId/unfollow'. Login required.
// The parameter 'userId' is for the user to be followed and we can obtain the current logged in user id fron the jsonwebtoken
router.post("/:userId/unfollow", authenticateUser, async (req, res) => {
  const { auth } = req.body;
  if (auth.userId === req.params.userId)
    return res.status(404).json({ msg: "You cannot unfollow yourself." });

  try {
    // Finding the user to be followed
    const userToBeUnfollowed = await User.findById(req.params.userId);

    // If user to be unfollowed is not found
    if (!userToBeUnfollowed)
      return res.status(404).json({ msg: "User not found." });

    // Finding the current user, which will be found because the user is logged in
    const currentUser = await User.findById(auth.userId);

    // If current user is not found
    if (!currentUser) return res.status(404).json({ msg: "User not found." });

    // Checking if already not following the requested user
    if (!currentUser.following.includes(userToBeUnfollowed._id))
      return res
        .status(404)
        .json({ msg: "Already not following the requested user." });

    // Updating the users to remove follow details
    await currentUser.updateOne({
      $pull: { following: userToBeUnfollowed._id },
    });
    await userToBeUnfollowed.updateOne({
      $pull: { followers: currentUser._id },
    });

    // Responding after the job is done
    res.status(200).json({ msg: "User unfollowed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error." });
  }
});

// Exports
export default router;
