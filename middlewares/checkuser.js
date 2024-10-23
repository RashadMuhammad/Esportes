const User = require('../models/user');

const checkUserStatus = async (req, res, next) => {
    // Check if the user is logged in
    if (req.session.userId) {
      try {
        const user = await User.findById(req.session.userId);
        // Check if the user exists and is blocked
        if (user) {
          if (user.status === "blocked") {
            req.session.destroy(err => {
              if (err) {
                return res.status(500).send("Could not log out.");
              }
              return res.redirect('/login');
            });
          } else {
            return next();
          }
        } else {
          req.session.destroy(err => {
            if (err) {
              return res.status(500).send("Could not log out.");
            }
            return res.redirect('/login');
          });
        }
      } catch (error) {
        return res.status(500).send("Server error.");
      }
    } else {
      return res.redirect('/login');
    }
  };