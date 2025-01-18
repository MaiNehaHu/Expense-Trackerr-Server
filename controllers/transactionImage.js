const Transaction = require("../model/transaction");

require("dotenv").config(); // Load environment variables from .env file

// upload
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

const BUCKET_NAME = process.env.BUCKET_NAME;
const aws = require("aws-sdk");
const s3 = new aws.S3();
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const User = require("../model/user");

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

// Handle image upload and save URL to the specific transaction
const handleImageUpload = async (req, res) => {
  try {
    const { id: userId, transactionId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const imageURL = req.file.location;

    // Find the user by userId
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the specific transaction in the transactions array and update the image URL
    const transactionIndex = user.transactions.findIndex(
      (txn) => txn._id.toString() === transactionId
    );

    if (transactionIndex === -1) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Update the image URL of the specific transaction
    user.transactions[transactionIndex].image = imageURL;

    // Save the updated user data with the modified transaction
    await user.save();

    res.status(200).json({
      message: "Image uploaded successfully to transaction",
      transaction: user.transactions[transactionIndex],
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image", error });
  }
};

// Delete image from AWS S3 and update the transaction
async function deleteImage(req, res) {
  try {
    const { id: userId, transactionId } = req.params;
    const { imageURL } = req.query;

    if (!imageURL) {
      return res.status(400).json({ error: "Image URL is required." });
    }

    if (!userId || !transactionId) {
      return res.status(400).json({ error: "User ID and Transaction ID are required." });
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

    // Find the user and update the specific transaction
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the transaction to update and remove the image
    const transactionIndex = user.transactions.findIndex(
      (txn) => txn._id.toString() === transactionId
    );

    if (transactionIndex === -1) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Remove the image from the specific transaction
    user.transactions[transactionIndex].image = "";

    // Save the updated user data with the modified transaction
    await user.save();

    res.status(200).json({
      message: "Image deleted successfully from transaction.",
      updatedTransaction: user.transactions[transactionIndex],
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image", error });
  }
}

module.exports = { deleteImage, uploadImage, handleImageUpload };
