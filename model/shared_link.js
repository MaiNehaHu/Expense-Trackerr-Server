const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
    {
        token: String,
        userId: String,
        sharedPeopleId: String,
        categoryId: String,
        peopleId: String,
        createdAt: Date,
    });

const SharedLink = mongoose.model("SharedLink", linkSchema);

module.exports = SharedLink;
