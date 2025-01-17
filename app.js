require("dotenv").config();

const express = require("express");
const connectDB = require("./db/connect");
const app = express();
const PORT = process.env.PORT || 2002;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hey Neha... Your Backend is running in browser 🎉");
});

const users_route = require("./routes/users");
app.use("/api/users", users_route);

const image_route = require("./routes/userImage");
app.use("/api/users/user-image", image_route);

const transactions_route = require("./routes/transactions");
app.use("/api/users/transactions", transactions_route);

const transh_route = require("./routes/trash");
app.use("/api/users/trash", transh_route);

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Yay!! Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Server Not Running: ", error);
  }
}

start();
