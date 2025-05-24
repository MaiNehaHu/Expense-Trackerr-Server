const User = require('../model/user');

async function getSearchResults(req, res) {
    try {
        const { id: userId, searchKeyWord } = req.params;

        // Validate inputs
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }
        if (!searchKeyWord) {
            return res.status(400).json({ message: 'Search keyword is required.' });
        }

        // Find the user and filter transactions matching the search keyword
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Filter transactions
        const matchingTransactions = user.transactions.filter(transaction => {
            const { note, category, amount, status } = transaction;
            const lowerSearchKeyWord = searchKeyWord.toLowerCase();

            return (
                (note && note.toLowerCase().includes(lowerSearchKeyWord)) ||
                (category.type && category.type.toLowerCase().includes(lowerSearchKeyWord)) ||
                (category.name && category.name.toLowerCase().includes(lowerSearchKeyWord)) ||
                (status && status.toLowerCase().includes(lowerSearchKeyWord)) ||
                (amount && amount == searchKeyWord)
            );
        });

        return res.status(200).json(matchingTransactions);
    } catch (error) {
        console.error('Error fetching search results:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

const deleteSelectedSearchedTrans = async (req, res) => {
    const { id: userId } = req.params;
    const { searchedTransactionIds } = req.body;

    try {
        if (!Array.isArray(searchedTransactionIds) || searchedTransactionIds.length === 0) {
            return res.status(400).json({ message: "No search transactions IDs provided" });
        }

        const validIds = [...new Set(searchedTransactionIds.filter(id => typeof id === 'string' && id.length > 0))];
        if (validIds.length === 0) {
            return res.status(400).json({ message: "No valid search transactions IDs provided" });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const deletedIds = [];
        const skippedIds = [];

        user.transactions = (user.transactions || []).filter(searchedTrans => {
            const id = searchedTrans._id?.toString();
            if (id && validIds.includes(id)) {
                deletedIds.push(id);
                return false; // Remove this
            }
            return true; // Keep it
        });

        user.markModified("transactions");
        await user.save();

        skippedIds.push(...validIds.filter(id => !deletedIds.includes(id)));

        res.status(200).json({
            message: "Selected search transactions deleted successfully",
            deleted: deletedIds,
            skipped: skippedIds,
        });
    } catch (error) {
        console.error("Error deleting search transactions:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

module.exports = { getSearchResults, deleteSelectedSearchedTrans };
