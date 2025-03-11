const User = require('../model/user')

const loginUser = async (req, res) => {
    try {
        return res.status(200).json({ message: "Hello" });
    } catch (error) {
     res.status(500).json({ message: "Error Login In", error });
    }
}

module.exports = { loginUser }