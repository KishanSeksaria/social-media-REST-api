// Imports and config
import express from "express";
const router = express.Router();
import { isLoggedIn } from "../middlewares/authentication.js";
import { deleteUser } from "../extras/delete.js";
import { findUser } from "../middlewares/find.js";
import { hashPassword } from "../extras/password.js";

// Routes
// ROUTE 1: Get a user. GET 'api/users/:userId'. No Login required.
router.get("/:userId", findUser, async (req, res) => {
  // Extracting foundUser from req
  const { foundUser } = req;

  // If found, take everything except password and send to the client
  const { password, ...others } = foundUser._doc;

  // Sending details of foundUser except password to the client
  res.status(200).json(others);
});

// ROUTE 2: Update a user. PUT '/api/users/:userId'. Login required.
router.put("/:userId", isLoggedIn, findUser, async (req, res) => {
  // Extracting user (as currentUser), foundUser and updatedUser (data to be updated) from req object
  const {
    foundUser,
    user: currentUser,
    body: { updatedUser },
  } = req;

  // If user is not the current user or an admin, respond unauthorized
  if (!currentUser.equals(foundUser) && !currentUser.isAdmin)
    return res.status(400).json({ msg: "Unauthorized." });

  try {
    // If user tries to update password, hash it again
    if (updatedUser.password)
      updatedUser.password = hashPassword(updatedUser.password);

    // Finally update the user with the fields entered by the user
    await foundUser.updateOne({ $set: updatedUser });

    // Sending the success response
    res.status(200).json({ msg: "User successfully updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 3: Delete a user. DELETE 'api/users/:userId'. Login required.
router.delete("/:userId", isLoggedIn, findUser, async (req, res) => {
  // Extracting currentUser and foundUser from req object
  const { user: currentUser, foundUser } = req;

  // If user is not the current user or an admin, respond unauthorized
  if (!currentUser.equals(foundUser) && !currentUser.isAdmin)
    return res.status(400).json({ msg: "Unauthorized." });

  try {
    // Deleting the user
    await deleteUser(foundUser);

    // If user deleted successfully, respond with a confirmation message
    res.status(200).json({ msg: "User successfully deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 4: Follow a user. POST 'api/users/:userId/follow'. Login required.
router.post("/:userId/follow", isLoggedIn, findUser, async (req, res) => {
  // Extracting currentUser and foundUser(as userToBeFollowed) from req.body
  const { user: currentUser, foundUser: userToBeFollowed } = req;

  // If the user tries to follow themselves
  if (currentUser.equals(userToBeFollowed))
    return res.status(404).json({ msg: "You cannot follow yourself." });

  // Checking if already following the requested user
  if (currentUser.following.includes(userToBeFollowed._id))
    return res
      .status(404)
      .json({ msg: "Already following the requested user." });

  try {
    // Updating the users to include follow details
    await currentUser.updateOne({ $push: { following: userToBeFollowed._id } });
    await userToBeFollowed.updateOne({ $push: { followers: currentUser._id } });

    // Responding after the job is done
    res.status(200).json({ msg: "User followed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 5 Unfollow a user. POST 'api/users/:userId/unfollow'. Login required.
router.post("/:userId/unfollow", isLoggedIn, findUser, async (req, res) => {
  // Extracting currentUser and foundUser(as userToBeUnfollowed) from req.body
  const { user: currentUser, foundUser: userToBeUnfollowed } = req;

  // If the user tries to unfollow themselves
  if (currentUser.equals(userToBeUnfollowed))
    return res.status(404).json({ msg: "You cannot unfollow yourself." });

  // Checking if already not following the requested user
  if (!currentUser.following.includes(userToBeUnfollowed._id))
    return res
      .status(404)
      .json({ msg: "Already not following the requested user." });

  try {
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
    res.status(500).json({ err });
  }
});

// Exports
export default router;
