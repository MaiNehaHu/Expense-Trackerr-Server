require("dotenv").config();
const admin = require("firebase-admin");
const User = require("../model/user");
const Category = require("../model/category");
const People = require("../model/people");

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
admin.initializeApp({ credential: admin.credential.cert(firebaseConfig) });

// Utility function to generate unique IDs
function generateUniqueId() {
    const randomString1 = Math.random().toString(36).substring(2, 8);
    const randomString2 = Math.random().toString(36).substring(2, 8);
    const randomNumber = Math.floor(Math.random() * 100);
    return `Ru-${randomString1}${randomNumber}${randomString2}`;
}

// Send OTP
exports.sendOTP = async (req, res) => {
    const { phone } = req.body;

    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    try {
        const userRecord = await admin.auth().createUser({ phoneNumber: phone });
        res.status(200).json({ message: "OTP sent via Firebase", uid: userRecord.uid });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Verify OTP (Handle new & existing users)
exports.verifyOTP = async (req, res) => {
    const { phone, firebaseUid } = req.body;

    if (!phone || !firebaseUid)
        return res.status(400).json({ error: "Phone and UID are required" });

    try {
        let user = await User.findOne({ phone });

        if (!user) {
            const uniqueId = generateUniqueId();

            const defaultCategory = await Category.create({
                hexColor: "#707070",
                name: "Others",
                sign: "-",
                type: "Spent",
            });

            const defaultPeople = await People.create({
                name: "Person Name",
                relation: "relation",
                contact: 9988776655
            })

            // **New user: Create user in MongoDB**
            user = new User({
                contact: phone,
                firebaseUid,
                userId: uniqueId,
                categories: [defaultCategory],
                people: [defaultPeople]
            });
            await user.save();
            return res.status(201).json({ message: "User registered successfully", user });
        }

        // **Existing user: Just return user data**
        res.status(200).json({ message: "OTP Verified, User Logged In", user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
