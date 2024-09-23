const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path')
const Category = require('./models/Category');
const passport = require('passport');
const authRoutes = require('./routes/auth');

const app = express();

// Database connection
mongoose.connect('mongodb://localhost:27017/Esportes')
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("An error occurred:", err);
    });

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(bodyParser.json({ limit: '50mb' }));  // For JSON data
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));  // For URL-encoded data

// Or if you're using express built-in parser instead of body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setting view engine to EJS
app.set('view engine', 'ejs');

// Session handling
app.use(session({
    secret: 'hello',  
    saveUninitialized: false,
    resave: false,
    cookie: {
        httpOnly: true,  // Helps prevent XSS attacks
        secure: false,   // Set to true when using HTTPS
        maxAge: 1000 * 60 * 60 * 1 // 1 hour session expiration
    }
}));



// Cache and cookie handling to prevent users from navigating back after logging out
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    next();
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);

// Import user routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Running on: http://localhost:${PORT}`);
});
