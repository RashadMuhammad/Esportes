const admin = require("../../models/admin");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const { log } = require("console");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});



// Admin login page render
exports.adminlogin = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {}
};

// Verifying login credentials
exports.verifylogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await admin.findOne({ email: email });

    if (adminData) {
      const passwordMatch = await bcrypt.compare(password, adminData.password);

      if (passwordMatch) {
        req.session.admin_id = adminData._id;

        req.session.save((err) => {
          if (err) {
          } else {
            res.redirect("/admin/Dashboard");
          }
        });
      } else {
        return res.render("admin/login", { message: "Incorrect password" });
      }
    } else {
      res.render("admin/login", { message: "Incorrect Gmail" });
    }
  } catch (error) {}
};

// Handle logout functionality
exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/admin/adminlogin");
  } catch (error) {}
};
