// Middleware for no caching
const noCache = (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    next();
};

const isAuthenticated = (req, res, next) => {
    if (req.session.userId || req.session.passport?.user) {
        next(); 
    } else {
        res.redirect('/login'); 
    }
};

const isNotAuthenticated = (req, res, next) => {
    if (req.session.userId || req.session.passport?.user) {
        res.redirect('/'); 
    } else {
        next(); 
    }
};

module.exports = { isAuthenticated, isNotAuthenticated , noCache };
