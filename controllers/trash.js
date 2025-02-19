const User = require("../model/user");
const Trash = require('../model/trash')

const BUCKET_NAME = process.env.BUCKET_NAME;
const aws = require("aws-sdk");
const s3 = new aws.S3();
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  apiVersion: "latest",
  region: process.env.REGION,
});

async function getAllTrashs(req, res) {
  const { id: userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId }).populate("trash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with the trash array
    res.status(200).json(user.trash);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving trash", error });
  }
}

async function deleteTrash(req, res) {
  const { id: userId, trashTransactionId } = req.params;
  const { imageURL } = req.query;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the transaction in the trash array
    const trashIndex = user.trash.findIndex((txn) => txn._id.toString() === trashTransactionId);
    if (trashIndex === -1) {
      return res.status(404).json({ message: "Transaction not found in trash" });
    }

    // Extract the image key from the URL if provided
    if (imageURL) {
      const imageKey = imageURL.includes("amazonaws.com")
        ? imageURL.split("/").pop()
        : imageURL;

      const params = {
        Bucket: BUCKET_NAME,
        Key: imageKey,
      };

      // Delete the image from AWS S3
      await s3.deleteObject(params).promise();
      console.log("Transaction image deleted from AWS S3.");
    }

    // Remove the transaction from the user's trash array
    const deletedTransaction = user.trash.splice(trashIndex, 1)[0];

    // Save the updated user data
    await user.save();

    // Delete the transaction from the database
    await Trash.findByIdAndDelete(deletedTransaction._id);

    // Respond with success message
    res.status(200).json({ message: "Transaction deleted from trash and database successfully" });

  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Error deleting transaction", error });
  }
}


async function emptyTrash(req, res) {
  const { id: userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract transaction IDs and image keys from the trash
    const transactionIds = user.trash.map((txn) => txn._id);
    const imageKeys = user.trash
      .map((txn) => txn.image) // Accessing txn.image directly
      .filter((key) => key); // Remove undefined or null values

    // Delete images from S3
    if (imageKeys.length > 0) {
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: imageKeys.map((key) => ({ Key: key })),
        },
      };
      await s3.deleteObjects(deleteParams).promise();
      console.log("All trash images deleted from S3");
    }

    // Delete the transactions from the database
    await Transaction.deleteMany({ _id: { $in: transactionIds } });

    // Clear the trash array in the user's data
    user.trash = [];

    // Save the updated user data
    await user.save();

    res.status(200).json({ message: "Trash emptied successfully, images deleted, and transactions removed" });
  } catch (error) {
    console.error("Error emptying trash:", error);
    res.status(500).json({ message: "Error emptying trash and deleting transactions", error });
  }
}

const autoDeleteOlderThanWeek = async (req, res) => {
  const { id: userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Delete from the Transaction model
    await Trash.deleteMany({ createdAt: { $lt: oneWeekAgo } });

    user.trash = user.trash.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= oneWeekAgo;
      // Keep transactions newer than 7 days
    });

    user.markModified(`trash`);

    await user.save();

    res.status(200).json({ message: "Transactions older than 7 days deleted successfully.", });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transactions older than 7 days.", error });
  }
};

module.exports = { getAllTrashs, deleteTrash, emptyTrash, autoDeleteOlderThanWeek };
