require("dotenv").config(); // Load environment variables from .env file

// upload
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

const BUCKET_NAME = process.env.BUCKET_NAME;
const aws = require("aws-sdk");
const s3 = new aws.S3();
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const User = require("../modules/user");

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  apiVersion: "latest",
  region: process.env.REGION,
});

// Multer setup for uploading images to AWS S3
const uploadImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, callBack) {
      callBack(null, { fieldName: file.fieldname });
    },
    key: function (req, file, callBack) {
      const fileExtension = path.extname(file.originalname);
      callBack(null, "image_" + Date.now().toString() + fileExtension);
    },
  }),
});

// Handle image upload and save URL to the user document
const handleImageUpload = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const imageURL = req.file.location;

    // Update the user's userImage with the new image URL
    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { userImage: imageURL },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Image uploaded successfully",
      userImage: imageURL,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image." });
  }
};

// Delete image from AWS S3 (already existing function)
async function deleteImage(req, res) {
  try {
    const { imageURL, userId } = req.query;

    if (!imageURL) {
      return res.status(400).json({ error: "Image URL is required." });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // Extract the image key from the URL
    const imageKey = imageURL.includes("amazonaws.com")
      ? imageURL.split("/").pop()
      : imageURL;

    const params = {
      Bucket: BUCKET_NAME,
      Key: imageKey,
    };

    // Delete the image from S3
    await s3.deleteObject(params).promise();
    console.log("Image deleted successfully from AWS S3.");

    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { $unset: { userImage: "" } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Image deleted successfully and user updated.",
      updatedUser,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image: ", error });
  }
}

module.exports = { deleteImage, uploadImage, handleImageUpload };
