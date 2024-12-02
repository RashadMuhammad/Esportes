const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const flash = require('connect-flash')
const dotenv = require("dotenv");
const User = require("./models/user"); 
const authRoutes = require("./routes/auth");
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Razorpay = require('razorpay');
const connectDB = require("./config/db");
const { handle500Error, handle404Error } = require('./middlewares/errorHandling');

// Load environment variables
dotenv.config();

connectDB()

const app = express();

// Middleware to parse request body
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public")); 
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setting view engine 
app.set("view engine", "ejs");

// Session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET_CODE,
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions', 
      ttl: 1 * 60 * 60, 
    }),
    cookie: {
      httpOnly: true,
      secure: true, 
      maxAge: 1000 * 60 * 60 * 1,
    },
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

app.use(flash())

// Initialize Passport and sessions
app.use(passport.initialize());
app.use(passport.session());

// Middleware to pass success or error messages 
app.use((req, res, next) => {
  res.locals.message = req.flash("message");
  res.locals.errorMessage = req.flash("errorMessage");
  next();
});

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://esportes.ddns.net/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const hashedPassword = await bcrypt.hash("noPassword",10)
          
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            password: hashedPassword,
            profileImageUrl: profile.photos[0].value,
          });
          await user.save();
          req.session.userId = user._id;
          
        }

        // Success: pass the user to the session
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

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
    failureRedirect: "/login"
  }),
  (req, res) => {
    // Ensure the session is established before checking user status
    if (req.user && req.user.status === "blocked") {
      req.logout(err => {
        if (err) {
          
        }
        // Store error message in session and redirect to login
        req.flash("message", "You have been blocked by the admin.");
        return res.redirect("/login");
      });
    } else {
      console.log("hello Hi sugaller")
      res.redirect("/");
    }
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

// Error-handling middleware
app.use(handle500Error);
app.use(handle404Error);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on http://localhost:3000');
});
