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
  const { id: userId } = req.params;
  const { transactionId, createdAt } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Match both ID and createdAt
    const txnIndex = user.trash.findIndex(
      (txn) =>
        txn._id.toString() === transactionId &&
        new Date(txn.createdAt).toISOString() === new Date(createdAt).toISOString()
    );

    if (txnIndex === -1) {
      return res.status(404).json({
        message: "Transaction not found in trash or createdAt does not match",
      });
    }

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

    // Filter trash in JS
    const filteredTrash = user.trash.filter(
      (txn) => txn?.createdAt && new Date(txn.createdAt) >= oneWeekAgo
    );

    // Update directly using findOneAndUpdate to avoid version conflicts
    await User.findOneAndUpdate(
      { userId },
      { $set: { trash: filteredTrash } }
    );

    return { success: true, message: "Old transactions deleted successfully" };
  } catch (error) {
    console.error("Error auto-deleting old trash:", error);
    return { success: false, message: "Error", error: error.message };
  }
}

async function revertBack(req, res) {
  const { id: userId } = req.params;
  const { transactionId, createdAt } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Match both ID and createdAt
    const txnIndex = user.trash.findIndex(
      (txn) =>
        txn._id.toString() === transactionId &&
        new Date(txn.createdAt).toISOString() === new Date(createdAt).toISOString()
    );

    if (txnIndex === -1) {
      return res.status(404).json({
        message: "Transaction not found in trash or createdAt does not match",
      });
    }

    const transactionToRestore = user.trash[txnIndex];
    if (!transactionToRestore) {
      return res.status(400).json({ message: "Transaction data is missing or invalid" });
    }

    // Destructure to exclude `deletedAt`
    const { deletedAt, ...cleanedTransaction } = transactionToRestore;

    user.transactions = user.transactions || [];
    user.transactions.push(cleanedTransaction);

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

const deleteSelectedTrashTrans = async (req, res) => {
  const { id: userId } = req.params;
  const { trashTransaction } = req.body;

  try {
    if (!Array.isArray(trashTransaction) || trashTransaction.length === 0) {
      return res.status(400).json({ message: "No trash transactions provided" });
    }

    const validPairs = trashTransaction
      .filter(txn => txn.transactionId && txn.createdAt)
      .map(txn => ({
        id: txn.transactionId,
        date: new Date(txn.createdAt).toISOString()
      }));

    if (validPairs.length === 0) {
      return res.status(400).json({ message: "No valid transactions provided" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const deletedIds = [];

    user.trash = (user.trash || []).filter(trashTrans => {
      const id = trashTrans._id?.toString();
      const created = new Date(trashTrans.createdAt).toISOString();

      const match = validPairs.find(p => p.id === id && p.date === created);
      if (match) {
        deletedIds.push(id);
        return false; // Remove
      }

      return true; // Keep
    });

    user.markModified("trash");
    await user.save();

    // Collect skipped transactions
    const validIds = validPairs.map(p => p.id);
    const skippedIds = validIds.filter(id => !deletedIds.includes(id));

    return res.status(200).json({
      message: "Selected trash transactions deleted successfully",
      deleted: validIds,
      skipped: skippedIds,
    });
  } catch (error) {
    console.error("Error deleting trash transactions:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const revertSelectedTrashTrans = async (req, res) => {
  const { id: userId } = req.params;
  const { trashTransaction } = req.body;

  try {
    if (!Array.isArray(trashTransaction) || trashTransaction.length === 0) {
      return res.status(400).json({ message: "No trash transactions provided for revert" });
    }

    const validPairs = trashTransaction
      .filter(txn => txn.transactionId && txn.createdAt)
      .map(txn => ({
        id: txn.transactionId,
        date: new Date(txn.createdAt).toISOString()
      }));

    if (validPairs.length === 0) {
      return res.status(400).json({ message: "No valid transactions provided for revert" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const restored = [];
    const notFound = [];

    user.trash = (user.trash || []).filter(trashTrans => {
      const id = trashTrans._id?.toString();
      const created = new Date(trashTrans.createdAt).toISOString();

      const match = validPairs.find(p => p.id === id && p.date === created);
      if (match) {
        const { deletedAt, ...restoredTxn } = trashTrans;
        user.transactions = user.transactions || [];
        user.transactions.push(restoredTxn);
        restored.push(id);
        return false; // remove from trash
      }

      return true; // keep in trash
    });

    const attemptedIds = validPairs.map(p => p.id);
    notFound.push(...attemptedIds.filter(id => !restored.includes(id)));

    user.markModified("trash");
    user.markModified("transactions");
    await user.save();

    return res.status(200).json({
      message: "Selected trash transactions restored successfully",
      restored,
      notFound
    });
  } catch (error) {
    console.error("Error reverting selected transactions:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


module.exports = {
  getAllTrashs,
  deleteTrash,
  emptyTrash,
  autoDeleteOlderThanWeek,
  revertBack,
  deleteSelectedTrashTrans,
  revertSelectedTrashTrans,
};
