const crypto = require("crypto");
const User = require("../model/user");

// POST /api/share-link
const createShareLink = async (req, res) => {
    try {
        const { userId, peopleId, categoryId } = req.body;

        if (!userId || !peopleId || !categoryId) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        user.sharedLinks = user.sharedLinks || [];

        const existingLink = user.sharedLinks.find(
            (link) =>
                link.peopleId === peopleId &&
                link.categoryId === categoryId
        );

        if (existingLink) {
            return res.status(200).json({
                message: "Link already exists.",
                link: `https://www.rupayie.com/shared/${existingLink.token}`,
                data: existingLink,
            });
        }

        const token = crypto.randomUUID();

        const newLink = {
            _id: token, // use token as _id
            token,
            peopleId,
            categoryId,
            createdAt: new Date(),
        };

        user.sharedLinks.push(newLink);
        user.markModified("sharedLinks");
        await user.save();

        return res.status(200).json({
            link: `https://www.rupayie.com/shared/${token}`,
            data: newLink,
        });
    } catch (error) {
        console.error("Error creating share link:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/shared/:token
const getSharedTransactions = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ "sharedLinks.token": token });

        if (!user) return res.status(404).json({ message: "Invalid or expired link." });

        const shared = user.sharedLinks.find((link) => link.token === token);
        if (!shared) return res.status(404).json({ message: "Link not found." });

        const { peopleId, categoryId } = shared;

        const transactions = (user.transactions || []).filter(
            (txn) =>
                txn.people?._id?.toString() === peopleId &&
                txn.category?._id?.toString() === categoryId
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

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json(user.sharedLinks || []);
    } catch (error) {
        console.error("Error fetching shared links:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/share-link/:idOrToken
const deleteSharedLinks = async (req, res) => {
    const { idOrToken } = req.params;

    try {
        const user = await User.findOne({ "sharedLinks.token": idOrToken });
        if (!user) return res.status(404).json({ message: "User not found" });

        const initialLength = user.sharedLinks.length;
        user.sharedLinks = user.sharedLinks.filter(
            (link) =>
                link.token !== idOrToken && link._id?.toString() !== idOrToken
        );

        if (user.sharedLinks.length === initialLength) {
            return res.status(404).json({ message: "Shared link not found" });
        }

        user.markModified("sharedLinks");
        await user.save();

        return res.status(200).json({ message: "Shared link deleted successfully" });
    } catch (error) {
        console.error("Error deleting shared link:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { createShareLink, getSharedTransactions, deleteSharedLinks, getSharedLinksByUserId };
