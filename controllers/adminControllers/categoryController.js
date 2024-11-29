const Category = require("../../models/Category");
const multer = require("multer");
const flash = require("flash");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Fetch categories with pagination and search functionality
exports.renderallcategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search ? req.query.search.trim() : "";

    let categoryQuery = {};
    if (searchQuery) {
      categoryQuery = { name: { $regex: searchQuery, $options: "i" } };
    }

    const totalCategories = await Category.countDocuments(categoryQuery);
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find(categoryQuery)
      .skip(skip)
      .limit(limit);

    res.render("admin/category", {
      categories,
      currentPage: page,
      totalPages,
      searchQuery,
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
};

// Edit category
exports.editcategories = async (req, res) => {
  const { name, description } = req.body;
  const image = req.file ? req.file.filename : null;

  const updateData = { name, description };
  if (image) updateData.image = image;

  try {
    await Category.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/admin/Categories");
  } catch (err) {
    if (err.code === 11000) {
      req.flash("message", "Category already Exists.");
      res.redirect("/admin/categories");
    } else {
      res.status(500).send("An error occurred while adding the category.");
    }
  }
};

//To Unlist Categories
exports.toggleCategoryListing = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    const newListingStatus = !category.isListed;

    await Category.findByIdAndUpdate(req.params.id, {
      isListed: newListingStatus,
    });

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

    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    category.isListed = !category.isListed;
    await category.save();

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

//To Delete Categories
exports.deletecategories = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/admin/Categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting category");
  }
};

//To Add New Categories
exports.addNewCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      req.flash("message", "Category already Exists");
      return res.redirect("/admin/Categories");
    }
    const image = req.file ? req.file.filename : null;
    const newCategory = new Category({ name, description, image });
    await newCategory.save();
    res.redirect("/admin/Categories");
  } catch (error) {
    res.status(204).send("An error occurred while adding the category.");
  }
};

// Check if category name exists
exports.checkname = async (req, res) => {
  const { name } = req.query;
  const exists = await Category.findOne({ name });
  res.json({ exists: !!exists });
};
