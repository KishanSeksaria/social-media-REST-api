// Imports and config
import express from "express";
const router = express.Router();
import passport from "../passport.js";
import User from "../models/User.js";
import { isLoggedIn, isLoggedOut } from "../middlewares/authentication.js";
import { hashPassword } from "../extras/password.js";

// Routes
// ROUTE 1: Register a new user. POST '/api/auth/register'. No Login required.
router.post("/register", isLoggedOut, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // If a user with same username already exists
    if (await User.findOne({ username: username }))
      return res.status(400).json({ msg: "Username already exists." });

    // If a user with same email already exists
    if (await User.findOne({ email: email }))
      return res.status(400).json({ msg: "Email already exists." });

    // Creating the new user with the entered credentials
    await User.create({
      username: username,
      email: email,
      // Hashing password before saving it to the db
      password: await hashPassword(password),
    });

    // Logging the user in after successful registration
    res.redirect("/api/auth/login");
  } catch (error) {
    res.status(500).json({ err });
  }
});

// ROUTE 2: Login a user. POST '/api/auth/login'. No Login required.
router.post(
  "/login",
  isLoggedOut,
  passport.authenticate("local", {
    failureRedirect: "failure",
    failureFlash: true,
  }),
  (req, res) => {
    console.log(req.authInfo);
    res.status(200).json(req.user);
  }
);

// ROUTE 3: Logout a user. POST '/api/auth/logout'. Login required.
router.post("/logout", isLoggedIn, (req, res) => {
  req.logOut();
  res.status(200).json({ msg: "Logged out successfully" });
});

// ROUTE 4: Authentication failure route. POST '/api/auth/failure'. No login required.
router.post("/failure", (req, res) => {
  res.json({ msg: req.flash("error")[0] });
});

// Exports
export default router;
