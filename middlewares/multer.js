const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/'); // Store images in 'public/uploads/'
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename with timestamp
  }
});

// File upload filter to accept only image files
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb('Error: Images only!');
  }
};

// Initialize upload with 3 file limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit size to 1MB
  fileFilter: fileFilter
});

module.exports = upload;
