const User = require("../model/user");

const getAnalytics = async (req, res) => {
  const { id: userId } = req.params;

  try {
    // Find user by userId and populate transactions
    const user = await User.findOne({ userId }).populate("transactions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter transactions for the current month
    const transactionsThisMonth = user.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    // Calculate total spent and earned
    let totalSpent = 0;
    let totalEarned = 0;

    transactionsThisMonth.forEach((transaction) => {
      if (transaction.category.sign === "-") {
        totalSpent += transaction.amount;
      } else if (transaction.category.sign === "+") {
        totalEarned += transaction.amount;
      }
    });

    res
      .status(200)
      .json({ totalSpent, totalEarned, totalAmount: totalEarned + totalSpent, balance: totalEarned - totalSpent });
  } catch (error) {
    res.status(500).json({ message: "Error getting analytics", error });
  }
};

module.exports = { getAnalytics };
