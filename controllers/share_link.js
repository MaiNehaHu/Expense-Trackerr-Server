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

        // Generate a secure unique token
        const token = crypto.randomUUID();

        // Create a new shared link document
        const linkData = new SharedLink({
            token,
            userId,
            peopleId,
            categoryId,
            createdAt: new Date(),
        });

        await linkData.save();

        // store in user.sharedLinks
        const user = await User.findOne({ userId });

        if (user) {
            user.sharedLinks = user.sharedLinks || [];
            user.sharedLinks.push(linkData);
            await user.save();
        }

        return res.status(200).json({
            link: `https://www.rupayie.com/shared/${token}`,
            data: linkData
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
            (txn) => txn.people?._id === peopleId && txn.category._id === categoryId
        );

        return res.status(200).json(transactions);

    } catch (error) {
        console.error("Error fetching shared transactions:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/share-link/user/:userId
const getSharedLinksByUserId = async (req, res) => {
    try {
        const { id: userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: "Missing userId parameter." });
        }

        // Fetch all shared links created by the user
        const sharedLinks = await SharedLink.find({ userId });

        if (!sharedLinks || sharedLinks.length === 0) {
            return res.status(404).json({ message: "No shared links found for this user." });
        }

        return res.status(200).json(sharedLinks);
    } catch (error) {
        console.error("Error fetching shared links:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const deleteSharedLinks = async (req, res) => {
    const { idOrToken } = req.params; // Can be either token or _id

    try {
        // Find the shared link by token or _id
        const sharedLink = await SharedLink.findOne({
            $or: [{ token: idOrToken }, { _id: idOrToken }]
        });

        if (!sharedLink) {
            return res.status(404).json({ message: "No shared link found" });
        }

        // Delete the shared link document
        await SharedLink.deleteOne({ _id: sharedLink._id });

        // Remove the reference from user's sharedLinks array
        await User.updateOne(
            { userId: sharedLink.userId },
            { $pull: { sharedLinks: { token: sharedLink.token } } }
        );

        return res.status(200).json({ message: "Shared link deleted successfully" });
    } catch (error) {
        console.error("Error deleting shared link:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { createShareLink, getSharedTransactions, deleteSharedLinks, getSharedLinksByUserId };
