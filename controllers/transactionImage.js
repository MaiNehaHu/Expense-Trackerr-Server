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
      callBack(null, "transaction_image_" + Date.now().toString() + fileExtension);
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

    // Update the image URL in the Transaction database first
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { image: imageURL },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ error: "Transaction not found in database" });
    }

    // Find the user by userId
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the specific transaction in the user's transactions array
    const transactionIndex = user.transactions.findIndex(
      (txn) => txn._id.toString() === transactionId
    );

    if (transactionIndex === -1) {
      return res.status(404).json({ error: "Transaction not found in user's transactions" });
    }

    // Update the image URL in the user's transactions array
    user.transactions[transactionIndex].image = updatedTransaction.image;

    // Mark the transactions array as modified
    user.markModified(`transactions.${transactionIndex}`);

    // Save the updated user data
    await user.save();

    res.status(200).json({
      message: "Image uploaded successfully to transaction",
      transaction_image: updatedTransaction.image,
      user_transaction_image: user.transactions[transactionIndex].image,
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

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    if (!imageURL) {
      return res.status(400).json({ error: "Image URL is required." });
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

    // Update the image URL in the Transaction database
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { image: "" },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ error: "Transaction not found in database." });
    }

    // Find the user by userId
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the transaction in the user's transactions array
    const transactionIndex = user.transactions.findIndex(
      (txn) => txn._id.toString() === transactionId
    );

    if (transactionIndex === -1) {
      return res.status(404).json({ error: "Transaction not found in user's transactions." });
    }

    // Update the image URL in the user's transactions array
    user.transactions[transactionIndex].image = "";

    // Mark the transactions array as modified
    user.markModified(`transactions.${transactionIndex}`);

    // Save the updated user data
    await user.save();

    res.status(200).json({
      message: "Image deleted successfully from transaction.",
      transaction_image: updatedTransaction.image,
      user_transaction_image: user.transactions[transactionIndex].image,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image", error });
  }
}

const handleOnlyImageUpload = async (req, res) => {
  try {
    const imageURL = req.file.location;

    res.status(200).json({
      message: "Image uploaded successfully to transaction",
      image: imageURL
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image", error });
  }
};

async function deleteOnlyImage(req, res) {
  try {
    const { imageURL } = req.query;

    if (!imageURL) {
      return res.status(400).json({ error: "Image URL is required." });
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


    res.status(200).json({
      message: "Image deleted successfully from transaction.",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image", error });
  }
}

module.exports = { deleteImage, uploadImage, handleImageUpload, handleOnlyImageUpload, deleteOnlyImage };
