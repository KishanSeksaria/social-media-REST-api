// Imports
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import helmet from "helmet";
import userRoute from "./routes/user.js";
import authRoute from "./routes/auth.js";
import postRoute from "./routes/post.js";
import commentRoute from "./routes/comment.js";
import session from "express-session";
import passport from "./passport.js";//harsh
import flash from "connect-flash";

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MongoURL = process.env.MongoURL || "mongodb://localhost:27017/social";

// Setting up DB connection
mongoose.connect(MongoURL, (err) => {
  err && console.log(err);
  !err && console.log("DB connection successful");
});

// Middlewares
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "session.secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 }, // 5 minutes = 5 minutes * 60 seconds * 1000 milliseconds
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);

// Routes
app.get("/", (req, res) => res.send("Hey There!"));

// Setting up server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
