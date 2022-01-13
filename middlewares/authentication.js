// Imports and config
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const jwtSecret =
  process.env.JWT_SECRET || "Thisismyreallylongjsonwebtokensecret.";

// Methods
const authenticateUser = (req, res, next) => {
  // Acquiring authentication token from request header
  const token = req.header("auth-token");

  // If there is no auth token in request header, send error
  if (!token) {
    return res
      .status(401)
      .json({ error: "Please authenticate using a valid token." });
  }

  try {
    // verifying and decoding the auth token using the jwt secret
    const data = jwt.verify(token, jwtSecret);

    // adding the decoded data as an object called auth into request
    req.body.auth = data;

    // calling the next parameter method of the super function
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Please authenticate using a valid token." });
  }
};

// Exports
export default authenticateUser;
