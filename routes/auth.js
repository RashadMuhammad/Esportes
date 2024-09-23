const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route to initiate Google Sign-In
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback route
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/' // Redirect to home if sign-in fails
}), (req, res) => {
  res.redirect('/'); // Redirect to dashboard after successful login
});

// Route to log out
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/'); // Redirect to home after logout
  });
});

module.exports = router;
