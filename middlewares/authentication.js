// Methods
// This middleware finds the current logged in user using the jtw and adds it to req.body as 'currentUser'
const isLoggedIn = (req, res, next) => {
  req.isAuthenticated()
    ? next()
    : res.status(401).json({ msg: "You need to login first." });
};

const isLoggedOut = (req, res, next) => {
  !req.isAuthenticated()
    ? next()
    : res.json({ msg: "Already logged in. Logout first." });
};

// Exports
export { isLoggedIn, isLoggedOut };
