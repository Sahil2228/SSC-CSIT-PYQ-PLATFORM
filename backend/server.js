const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const questionRoutes = require("./routes/questionRoutes");
const plannerRoutes = require("./routes/plannerRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Test route
app.get("/", (req, res) => {
    res.send("SSC CSIT PYQ Backend is Running!");
});

// Question routes
app.use("/api/questions", questionRoutes);

app.use("/api/planner", plannerRoutes);

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});