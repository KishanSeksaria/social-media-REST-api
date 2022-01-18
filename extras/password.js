// Imports
import bcrypt from "bcrypt";

// Creating a new password hash and returning it
const hashPassword = async (password) =>
  await bcrypt.hash(password, await bcrypt.genSalt(10));

// Verifying if the password entered matches the user
const verifyPassword = async (password, user) =>
  await bcrypt.compare(password, user.password);

// Exports
export { hashPassword, verifyPassword };
