const User = require("../model/user");

async function getAllTrashs(req, res) {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId }).populate("trash");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.trash || []);
  } catch (error) {
    console.error("Error retrieving trash:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

async function deleteTrash(req, res) {
  const { id: userId, trashTransactionId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const txnIndex = user.trash.findIndex((txn) => txn._id.toString() === trashTransactionId);
    if (txnIndex === -1) return res.status(404).json({ message: "Transaction not found in trash" });

    const deletedTxn = user.trash[txnIndex];

    user.trash.splice(txnIndex, 1);
    user.markModified("trash");
    await user.save();

    res.status(200).json({ message: "Transaction deleted from trash successfully" });
  } catch (error) {
    console.error("Error deleting trash:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

async function emptyTrash(req, res) {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.trash = [];
    await user.save();

    res.status(200).json({ message: "Trash emptied successfully" });
  } catch (error) {
    console.error("Error emptying trash:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

async function autoDeleteOlderThanWeek(req, res) {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    user.trash = user.trash.filter(
      (txn) => txn?.createdAt && new Date(txn.createdAt) >= oneWeekAgo
    );

    user.markModified("trash");
    await user.save();

    res.status(200).json({ message: "Old transactions deleted successfully" });
  } catch (error) {
    console.error("Error auto-deleting old trash:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

async function revertBack(req, res) {
  const { id: userId, trashTransactionId } = req.params;

  try {
    // Find the user
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const txnIndex = user.trash.findIndex((txn) => txn._id.toString() === trashTransactionId);
    if (txnIndex === -1) return res.status(404).json({ message: "Transaction not found in trash" });

    const transactionToRestore = user.trash[txnIndex];
    if (!transactionToRestore) {
      return res.status(400).json({ message: "Transaction data is missing or invalid" });
    }

    user.transactions = user.transactions || [];
    user.transactions.push(transactionToRestore);

    user.trash.splice(txnIndex, 1);
    user.markModified("trash");
    user.markModified("transactions");

    await user.save();

    res.status(200).json({
      message: "Transaction restored successfully",
      transaction: transactionToRestore,
    });
  } catch (error) {
    console.error("Error reverting transaction:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
}

module.exports = {
  getAllTrashs,
  deleteTrash,
  emptyTrash,
  autoDeleteOlderThanWeek,
  revertBack,
};
