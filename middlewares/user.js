// Middleware for no caching
const noCache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    next();
};

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next(); // User is authenticated, proceed to the next middleware or route
    } else {
        res.redirect('/login'); // If not authenticated, redirect to login
    }
};

// Middleware to check if the user is not authenticated (for login and signup)
const isNotAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/'); // If logged in, redirect to the home page
    } else {
        next(); // Proceed to the next middleware or route
    }
};

module.exports = { isAuthenticated, isNotAuthenticated , noCache };
