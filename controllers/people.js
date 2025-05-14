const People = require("../model/people");
const User = require('../model/user');

async function addPerson(req, res) {
    const { id: userId } = req.params;
    const { name, contact, relation } = req.body;

    try {
        if (!name || !contact || !relation) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const newPerson = new People({
            name,
            contact,
            relation,
        });

        user.people.push(newPerson);
        user.markModified("people");
        await user.save();

        res.status(201).json({ message: "Person added successfully", person: newPerson });
    } catch (error) {
        console.error("Error adding person:", error);
        res.status(500).json({ error: "Failed to add person" });
    }
}

// Get all users
async function getAllPeople(req, res) {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user.people || []);
    } catch (error) {
        console.error("Error fetching people:", error);
        res.status(500).json({ error: "Failed to fetch people" });
    }
}

// Get a user by their unique ID
const editPerson = async (req, res) => {
    const { id: userId, personId } = req.params;
    const { name, contact, relation } = req.body;

    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const personIndex = user.people.findIndex(
            (person) => person._id.toString() === personId
        );

        if (personIndex === -1) {
            return res.status(404).json({ message: "Person not found in user" });
        }

        // Update the person in user.people
        user.people[personIndex] = {
            ...user.people[personIndex],
            name,
            contact,
            relation,
        };

        const updatedPerson = user.people[personIndex];

        // Helper function to safely update person references
        const updatePerson = (record) => {
            if (
                record.people &&
                record.people._id &&
                record.people._id.toString() === personId
            ) {
                record.people.name = name;
                record.people.contact = contact;
                record.people.relation = relation;
            }
        };

        // Update in user.transactions
        if (Array.isArray(user.transactions)) {
            user.transactions.forEach(updatePerson);
            user.markModified("transactions");
        }

        // Update in user.trash
        if (Array.isArray(user.trash)) {
            user.trash.forEach(updatePerson);
            user.markModified("trash");
        }

        // Update in user.recuringTransactions
        if (Array.isArray(user.recuringTransactions)) {
            user.recuringTransactions.forEach(updatePerson);
            user.markModified("recuringTransactions");
        }

        // Update in user.notifications.transaction.people
        if (Array.isArray(user.notifications)) {
            user.notifications.forEach((not) => {
                if (
                    not.transaction?.people &&
                    typeof not.transaction.people === "object" &&
                    not.transaction.people._id?.toString() === personId
                ) {
                    not.transaction.people.name = name;
                    not.transaction.people.contact = contact;
                    not.transaction.people.relation = relation;
                }
            });
            user.markModified("notifications");
        }

        // Save final update
        user.markModified("people");
        await user.save();

        res.status(200).json({
            message: "Person updated in user and all embedded records",
            person: updatedPerson,
        });
    } catch (error) {
        console.error("Error editing person:", error);
        res.status(500).json({ message: "Error editing person", error });
    }
};

async function deletePerson(req, res) {
    const { id: userId, personId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const initialLength = user.people.length;
        user.people = user.people.filter(
            (person) => person._id.toString() !== personId
        );

        if (user.people.length === initialLength) {
            return res.status(404).json({ message: "Person not found in user" });
        }

        user.markModified("people");
        await user.save();

        res.status(200).json({ message: "Person deleted successfully" });
    } catch (error) {
        console.error("Error deleting person:", error);
        res.status(500).json({ error: "Failed to delete person" });
    }
}

module.exports = { addPerson, getAllPeople, editPerson, deletePerson }