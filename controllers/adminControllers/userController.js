const User = require("../../models/user");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); // Store images in the 'public/uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});


// Render the user management page
exports.renderUser = async (req, res) => {
    res.render("admin/users");
  };
  
  // Fetch users with pagination and search functionality
  exports.getAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const searchQuery = req.query.search ? req.query.search.trim() : "";
  
      let userQuery = {};
      if (searchQuery) {
        userQuery = {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
        };
      }
  
      const totalUsers = await User.countDocuments(userQuery);
      const totalPages = Math.ceil(totalUsers / limit);
  
      const users = await User.find(userQuery).skip(skip).limit(limit).exec();
  
      res.render("admin/users", {
        users,
        currentPage: page,
        totalPages,
        searchQuery,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  // Toggle block/unblock status
  exports.toggleBlock = async (req, res) => {
    try {
      const userId = req.params.id;
  
      const user = await User.findById(userId);
  
      if (user) {
        user.status = user.status === "blocked" ? "active" : "blocked";
        await user.save();
  
        if (user.status === "blocked") {
          delete req.session.userId;
        }
        res.redirect("/admin/users");
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  