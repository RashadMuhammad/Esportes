const Category = require("../models/Category");
const Product = require("../models/Product");
const admin = require("../models/admin");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { product } = require("./usercontroller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); // Store images in the 'public/uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});

// Admin login page render
exports.adminlogin = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error.message);
  }
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
            console.log("Session save error:", err);
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
  } catch (error) {
    console.log("Login error:", error.message);
  }
};

// Render the dashboard
exports.renderDashboard = async (req, res) => {
  try {
    const adminData = await admin.find();
    res.render("admin/index", { admin: adminData });
  } catch (error) {
    console.log(error.message);
  }
};

// Render the user management page
exports.renderUser = async (req, res) => {
  res.render("admin/users");
};

// Fetch all users and render to the view
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.render("admin/users", { users }); // Pass users to the view
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
      user.status = user.status === "blocked" ? "active" : "blocked"; // Toggle status
      await user.save();
      res.redirect("/admin/users"); // Redirect to the user list
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).send("Internal Server Error");
  }
};

//To Search Users from Search <Bar></Bar>
// const User = require('../models/users');

// Fetch all users or filter based on search query
// exports.SearchUsers = async (req, res) => {
//     try {
//         const searchQuery = req.query.search || ''; // Get search query from URL, or default to empty string
//         const searchRegex = new RegExp(searchQuery, 'i'); // Create case-insensitive regex for matching

//         const users = await User.find({
//             $or: [
//                 { username: searchRegex }, // Search by username
//                 { email: searchRegex }     // Search by email
//             ]
//         });

//         // Render the 'users' view and pass the users data and searchQuery to the view
//         res.render('admin/users', { users, searchQuery });
//     } catch (error) {
//         console.error('Error fetching users:', error);
//         res.status(500).send("Internal Server Error");
//     }
// };

// Render the products page
// exports.renderProducts = async (req, res) => {
//   res.render("admin/products");
// };

// Get all products with category populated
exports.getAllProducts = async (req, res) => {
  try {
    const product = await Product.find().populate("category").exec();

    const categories = await Category.find();
    // console.log(product);
    // console.log(product[0]);
    // console.log(products,categories);
    // console.log(product[3])

    res.render("admin/products", { product, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { productNo, name, description, category, stock, price } = req.body;

    // Process images
    const imageNames = req.files.map((file) => file.filename);

    // Create and save the new product with the images
    const newProduct = new Product({
      productNo,
      name,
      description,
      category,
      stock,
      price,
      images: imageNames,
    });

    await newProduct.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).send("Error adding product.");
  }
};

// Function to save base64 image as file
// const saveCroppedImage = (base64Image, filename) => {
//   const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
//   const buffer = Buffer.from(base64Data, "base64");
//   const filePath = path.join(__dirname, "../public/uploads/", filename);

//   fs.writeFileSync(filePath, buffer);
//   return filename;
// };

exports.editProduct = async (req, res) => {

  console.log(req.body);

  try {
    const { productNo, name, description, category, stock, price } = req.body;
    const imageNames = req.files.map((file) => file.filename);

    const newProduct = new Product({
      productNo,
      name,
      description,
      category,
      stock,
      price,
      images: imageNames,
    });

    // await Product.findByIdAndUpdate(req.params.id, req.body);
    res.status(201).redirect("/admin/products");
  } catch (error) {
    res.status(400).send("Error adding product.");
  }
};

//Toggle Unlist
exports.toggleProductListing = async (req, res) => {
  try {
    // Fetch the product by ID
    const product = await Product.findById(req.params.id);

    // Toggle the listed status
    const newListingStatus = !product.listed;

    await Product.findByIdAndUpdate(req.params.id, {
      listed: newListingStatus,
    });

    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Render orders page
exports.renderOrders = async (req, res) => {
  res.render("admin/orders");
};

// Render add-category form
exports.renderAddCategoryForm = (req, res) => {
  res.render("admin/category");
};

// Get all categories
exports.renderallcategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    // console.log(categories);

    res.render("admin/category", { categories }); // Pass categories to the EJS view
  } catch (err) {
    res.status(500).send("Error fetching categories");
  }
};

// Edit category
exports.editcategories = async (req, res) => {
  const { name, description } = req.body;
  const image = req.file ? req.file.filename : null; // Get the image filename if uploaded

  const updateData = { name, description };
  if (image) updateData.image = image; // Include image if it was uploaded

  try {
    await Category.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/admin/Categories"); // Redirect to categories page after update
  } catch (err) {
    res.status(500).send("Error editing category");
  }
};

exports.toggleCategoryListing = async (req, res) => {
  try {
    // Fetch the category by ID
    const category = await Category.findById(req.params.id);

    // Toggle the `isListed` status
    const newListingStatus = !category.isListed;

    // Update the category's `isListed` field in the database
    await Category.findByIdAndUpdate(req.params.id, {
      isListed: newListingStatus,
    });

    // Redirect to the admin categories page
    res.redirect("/admin/Categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Function to unlist a category
exports.unlistcategories = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Find the category by ID and toggle its `isListed` field
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Toggle the `isListed` field
    category.isListed = !category.isListed;
    await category.save();

    // Respond with success and updated `isListed` status
    res.status(200).json({
      success: true,
      isListed: category.isListed,
      message: "Category status updated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

exports.deletecategories = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/admin/Categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting category");
  }
};

// Add new category with a single image
exports.addNewCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Get image path from the uploaded file
    const image = req.file ? req.file.filename : null;

    // Create and save a new category
    const newCategory = new Category({
      name,
      description,
      image,
    });
    await newCategory.save();
    res.redirect("/admin/Categories"); // Redirect to categories list after adding
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).send("An error occurred while adding the category.");
  }
};

// Render coupons page
exports.renderCoupons = async (req, res) => {
  res.render("admin/coupons");
};

// Render offers page
exports.renderOffers = async (req, res) => {
  res.render("admin/offers");
};

// Render deals page
exports.renderDeals = async (req, res) => {
  res.render("admin/deals");
};

// Render settings page
exports.renderSettings = async (req, res) => {
  res.render("admin/settings");
};

// Handle logout functionality
exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.redirect("/admin/adminlogin");
  } catch (error) {
    console.log(error.message);
  }
};
