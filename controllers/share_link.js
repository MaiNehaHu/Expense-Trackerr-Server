const crypto = require("crypto");
const User = require('../model/user');
const SharedLink = require('../model/shared_link');

// POST /api/share-link
const createShareLink = async (req, res) => {
    try {
        const { userId, peopleId, categoryId } = req.body;

        if (!userId || !peopleId || !categoryId) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const token = crypto.randomUUID(); // Generate a secure unique token
        const linkData = {
            token,
            userId,
            peopleId,
            categoryId,
            createdAt: new Date(),
        };

        await SharedLink.insertOne(linkData);

        return res.status(200).json({
            link: `https://rupayie-shared.vercel.app/shared/${token}`,
        });

    } catch (error) {
        console.error("Error creating share link:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/shared/:token
const getSharedTransactions = async (req, res) => {
    try {
        const { token } = req.params;

        const shared = await SharedLink.findOne({ token });

        if (!shared) {
            return res.status(404).json({ message: "Invalid link." });
        }

        const { userId, peopleId, categoryId } = shared;

        // Fetch the user with embedded transactions
        const user = await User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const transactions = (user.transactions || []).filter(
            (txn) => txn.people === peopleId && txn.category === categoryId
        );

        return res.status(200).json({ transactions });

    } catch (error) {
        console.error("Error fetching shared transactions:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { createShareLink, getSharedTransactions };
