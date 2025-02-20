const User = require('../model/user');

async function getSearchResults(req, res) {
    try {
        const { id: userId, searchKeyWord } = req.params;
        const { type, category } = req.query;

        // Validate inputs
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        // Find the user and filter transactions matching the search keyword
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const lowerSearchKeyWord = searchKeyWord?.toLowerCase() || "";
        const lowerType = (type || "").toLowerCase();
        const lowerCategory = (category || "").toLowerCase();

        // Filter transactions based on search keyword, type, and category
        const matchingTransactions = user.transactions.filter(transaction => {
            const { note, category, amount, status } = transaction;

            const matchesSearchKeyWord =
                (note && note.toLowerCase().includes(lowerSearchKeyWord)) ||
                (category?.type && category.type.toLowerCase().includes(lowerSearchKeyWord)) ||
                (category?.name && category.name.toLowerCase().includes(lowerSearchKeyWord)) ||
                (status && status.toLowerCase().includes(lowerSearchKeyWord)) ||
                (amount && amount == searchKeyWord);

            const matchesType = lowerType ? category?.type?.toLowerCase() === lowerType : true;
            const matchesCategory = lowerCategory ? category?.name?.toLowerCase() === lowerCategory : true;

            return matchesSearchKeyWord && matchesType && matchesCategory;
        });

        return res.status(200).json(matchingTransactions);
    } catch (error) {
        console.error('Error fetching search results:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = { getSearchResults };
