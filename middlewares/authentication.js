// Imports and config
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

// Methods
// This middleware finds the current logged in user using the jtw and adds it to req.body as 'currentUser'
const authenticateUser = async (req, res, next) => {
  // Acquiring authentication token from request header
  const token = req.header('auth-token');

  // If there is no auth token in request header, send error
  if (!token) {
    return res
      .status(401)
      .json({ error: 'Please authenticate using a valid token.' });
  }

  try {
    // verifying and decoding the auth token using the jwt secret
    const data = jwt.verify(token, jwtSecret);

    // Check if the user still exists
    // Search for the user
    const user = await User.findById(data.userId);

    // If user not found
    if (!user)
      return res
        .status(401)
        .json({ error: 'Please authenticate using a valid token.' });

    // adding the current user to request object body
    req.body.currentUser = user;

    // calling the next parameter method of the super function
    next();
  } catch (error) {
    console.error(err);
    return res.status(500).json({ err });
  }
};

// Exports
export default authenticateUser;
