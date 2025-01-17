const express = require("express");
const router = express.Router();

const {
  uploadImage,
  deleteImage,
  handleImageUpload,
} = require("../controllers/userImage");

// Route to upload and delete images
router.post("/", uploadImage.single("file"), handleImageUpload);

router.delete("/delete", deleteImage);

module.exports = router;
