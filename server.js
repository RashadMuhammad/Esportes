const express = require("express");
const session = require("express-session");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require('./models/user'); // Assuming User is exported from a models directory
const path = require("path");
const passport = require("passport");
const authRoutes = require("./routes/auth");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

// Database connection
mongoose
  .connect("mongodb://localhost:27017/Esportes")
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("An error occurred:", err);
  });

// Middleware to parse request body
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use(express.json({ limit: "50mb" })); // For JSON data
app.use(express.urlencoded({ limit: "50mb", extended: true })); // For URL-encoded data

// Or if you're using express built-in parser instead of body-parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setting view engine to EJS
app.set("view engine", "ejs");

// Session handling
app.use(
  session({
    secret: "hello",
    saveUninitialized: false,
    resave: false,
    cookie: {
      httpOnly: true, // Helps prevent XSS attacks
      secure: false, // Set to true when using HTTPS
      maxAge: 1000 * 60 * 60 * 1, // 1 hour session expiration
    },
  })
);

// Cache and cookie handling to prevent users from navigating back after logging out
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    // Check if the user already exists in the database
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // If user doesn't exist, create a new one
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value, // Assuming profile.emails is available
          profileImageUrl: profile.photos[0].value, // Assuming profile.photos is available
        });
        await user.save();
      }
  
      // Pass the user to the session
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
  
  // Serialize and deserialize user to/from session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        req.session.userId = 'sdfe'
      // User is authenticated and now stored in session
      res.redirect("/"); // Redirect to home or dashboard
    }
  );


// Routes
app.use("/auth", authRoutes);

// Import user routes
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Running on: http://localhost:${PORT}`);
});
