const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route to initiate Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Route to handle callback after Google authentication
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard or another page.
    res.redirect('/');
  }
);

module.exports = router;
