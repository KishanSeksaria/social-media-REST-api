import passport from "passport";
import passportLocal from "passport-local";
import User from "./models/User.js";
const localStrategy = passportLocal.Strategy;
import { verifyPassword } from "./extras/password.js";

passport.use(
  new localStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        // Searching for existing user with the entered email
        const foundUser = await User.findOne({ email: email });

        // If no user exists with the entered email
        if (!foundUser)
          return done(null, false, { message: "User not found." });

        // If passwords don't match
        if (!(await verifyPassword(password, foundUser)))
          return done(null, false, { message: "Password Incorrect." });

        done(null, foundUser);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Searching for the user in the db
    const user = await User.findById(id);

    // If user not found, return false
    if (!user) return done(null, false, { message: "User not found." });

    // If user found, return it
    done(null, user);
  } catch (err) {
    done(e);
  }
});

export default passport;
