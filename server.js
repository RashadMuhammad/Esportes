const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const flash = require('connect-flash')
const dotenv = require("dotenv");
const User = require("./models/user"); // Assuming User is exported from a models directory
const authRoutes = require("./routes/auth");
const MongoStore = require('connect-mongo');
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Load environment variables
dotenv.config();

const app = express();

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("An error occurred:", err));

// Middleware to parse request body
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setting view engine to EJS
app.set("view engine", "ejs");

// Session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET_CODE,
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions', // Optional: specify collection name for sessions
      ttl: 1 * 60 * 60, // Session expiration time in seconds (1 hour)
    }),
    cookie: {
      httpOnly: true,
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

app.use(flash())

// Initialize Passport and sessions
app.use(passport.initialize());
app.use(passport.session());

// Middleware to pass success or error messages using render instead of flash
app.use((req, res, next) => {
  res.locals.message = req.flash("message");
  res.locals.success = req.session.message;
  next();
});

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Create a new user if not found
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profileImageUrl: profile.photos[0].value,
          });
          await user.save();
        }

        // Success: pass the user to the session
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

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

// Google Auth callback route
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Check if the user is blocked
    if (req.user.status === "blocked") {
      req.flash("message","User have been Blocked by Admin")
      return res.redirect("/login");
    }
    // Authentication successful, redirect to home
    res.render("home", { error: null, success: "Successfully signed in with Google!" });
  }
);

// Routes
app.use("/auth", authRoutes);

// Import user routes
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

// Import admin routes
const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
});
