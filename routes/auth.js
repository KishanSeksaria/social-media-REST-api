// Imports and config
import express from "express";
const router = express.Router();
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const jwtSecret =
  process.env.JWT_SECRET || "Thisismyreallylongjsonwebtokensecret.";

// Routes
// ROUTE 1: Register a new user. POST '/api/auth/register'. No Login required.
router.post("/register", async (req, res) => {
  try {
    const { user } = req.body;
    // If a user with same username already exists
    if (await User.findOne({ username: user.username }))
      return res.status(400).json({ msg: "Username already exists." });

    // If a user with same email already exists
    if (await User.findOne({ email: user.email }))
      return res.status(400).json({ msg: "Email already exists." });

    // Creating the new user with the entered credentials
    const newUser = await User.create({
      username: user.username,
      email: user.email,
      // Hashing password before saving it to the db
      password: await bcrypt.hash(user.password, await bcrypt.genSalt(10)),
    });

    // Creating login authentication using jwt and sending the token to the client
    const authToken = jwt.sign(
      { userId: newUser._id, isAdmin: newUser.isAdmin },
      jwtSecret
    );
    res.status(200).json({ authToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

// ROUTE 2: Login a user. POST '/api/auth/login'. No Login required.
router.post("/login", async (req, res) => {
  const { user } = req.body;
  try {
    // Searching for existing user with the entered email
    const foundUser = await User.findOne({ email: user.email });

    // If no user exists with the entered email
    if (!foundUser) return res.status(404).json({ msg: "Email not found." });

    // If passwords don't match
    if (!(await bcrypt.compare(user.password, foundUser.password)))
      return res.status(404).json({ msg: "Wrong password." });

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

// Exports
export default router;
