const User = require("../model/user");
const Category = require("../model/category");
const People = require("../model/people");

// Utility function to generate a unique userId
function generateUniqueId() {
    const randomString1 = Math.random().toString(36).substring(2, 8);
    const randomString2 = Math.random().toString(36).substring(2, 8);
    const randomNumber = Math.floor(Math.random() * 100);
    return `Ru-${randomString1}${randomNumber}${randomString2}`;
}

// Signup or Login Function (OTP-Based)
const authenticateUser = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const lowercasedEmail = email.toLowerCase();

        // Check if user already exists
        let user = await User.findOne({ email: lowercasedEmail });

        if (!user) {
            // Create default category and person
            const defaultSpent = await Category.create({
                hexColor: "#707070",
                name: "Others",
                sign: "-",
                type: "Spent",
            });
            const defaultEarned = await Category.create({
                hexColor: "#1734eb",
                name: "Salary",
                sign: "+",
                type: "Earned",
            });

            const defaultPeople = await People.create({
                name: "Person Name",
                relation: "Relation",
                contact: 9999988888
            });

            // Create and save new user
            user = new User({
                email: lowercasedEmail,
                userId: generateUniqueId(),
                categories: [defaultSpent, defaultEarned],
                people: [defaultPeople],
                transactions: [],
                recuringTransactions: [],
                trash: [],
                notifications: [],
                budgets: [],
            });

            await user.save();
        }

        res.status(200).json({ message: "User authenticated successfully", userId: user.userId });
    } catch (error) {
        console.error("Error during authentication:", error);
        res.status(500).json({ message: "Error during authentication", error: error.message });
    }
};

module.exports = { authenticateUser };
