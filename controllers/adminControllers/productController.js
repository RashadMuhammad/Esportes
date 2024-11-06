const Category = require("../../models/Category");
const Product = require("../../models/Product");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/uploads/"); // Store images in the 'public/uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});


// Get all products
exports.getAllProducts = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const searchQuery = req.query.search ? req.query.search.trim() : "";
  
      let productQuery = {};
      if (searchQuery) {
        productQuery = { name: { $regex: searchQuery, $options: "i" } };
      }
  
      const totalProducts = await Product.countDocuments(productQuery);
  
      const product = await Product.find(productQuery)
        .populate("category")
        .skip(skip)
        .limit(limit)
        .exec();
  
      const categories = await Category.find();
      const totalPages = Math.ceil(totalProducts / limit);
  
      res.render("admin/products", {
        product,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        categories,
        searchQuery,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  };
  
  //To add Product
  exports.addProduct = async (req, res) => {
    try {
      const { productNo, name, description, category, stock, price } = req.body;
  
      const existingProduct = await Product.findOne({ name: name });
      if (existingProduct) {
        req.flash(
          "errorMessage",
          "Product name already exists. Please choose another name."
        );
        console.log("Flash Error Set:", req.flash("errorMessage"));
        return res.redirect("/admin/products"); 
      }
  
      // Process images and save the new product
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
  
      await newProduct.save();
      req.flash("message", "Product added successfully!");
      res.redirect("/admin/Products");
    } catch (error) {
      console.error("Error adding product:", error);
      req.flash("errorMessage", "Error adding product.");
      res.redirect("/admin/products");
    }
  };
  
  //To edit Product
  exports.editProduct = async (req, res) => {
    const productId = req.params.id;
  
    try {
      const product = await Product.findById(productId);
  
      const productData = {
        productNo: req.body.productNo,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
        category: req.body.category,
        images: product.images,
      };
  
      if (req.body.deleteImages) {
        const imagesToDelete = Array.isArray(req.body.deleteImages)
          ? req.body.deleteImages
          : [req.body.deleteImages];
  
        imagesToDelete.forEach((image) => {
          productData.images = productData.images.filter((img) => img !== image);
  
          const imagePath = path.join(__dirname, "..", "uploads", image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
  
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file) => file.filename);
        productData.images = [...productData.images, ...newImages];
      }
  
      await Product.findByIdAndUpdate(productId, productData);
  
      res.status(200).redirect("/admin/products");
    } catch (error) {
      
      res.status(400).send("Error editing product.");
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
  