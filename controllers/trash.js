const User = require("../model/user");
const Trash = require("../model/transaction");
const Transaction = require('../model/transaction')

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

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the transaction exists in the trash
    const trashIndex = user.trash.findIndex((txn) => txn._id.toString() === trashTransactionId);
    if (trashIndex === -1) {
      return res.status(404).json({ message: "Transaction not found in trash" });
    }

    // Remove the transaction from the trash array
    user.trash.splice(trashIndex, 1);

    // Save the updated user data
    await user.save();

    // Get the transaction ID to delete from the transactions database
    const transactionId = user.trash[trashIndex]._id;

    // Delete the transaction from the transactions database
    await Transaction.findByIdAndDelete(transactionId);

    // Respond with success message
    res.status(200).json({ message: "Transaction deleted from trash and database successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transaction from trash and database", error });
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

    // Extract transaction IDs from the trash
    const transactionIds = user.trash.map((txn) => txn._id);

    // Delete the transactions from the transactions database
    await Transaction.deleteMany({ _id: { $in: transactionIds } });

    // Clear the trash array in the user's data
    user.trash = [];

    // Save the updated user data
    await user.save();

    res.status(200).json({ message: "Trash emptied successfully and transactions deleted" });
  } catch (error) {
    console.error(error);
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

    // Delete from the Trash model
    await Trash.deleteMany({ createdAt: { $lt: oneWeekAgo } });

    // Filter the user's trash array to remove transactions older than 7 days
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
