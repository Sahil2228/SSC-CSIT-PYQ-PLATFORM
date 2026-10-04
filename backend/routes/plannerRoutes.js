const express = require("express");

const router = express.Router();

const {
    getPlanner
} = require("../controllers/PlannerController");

router.get("/", getPlanner);

module.exports = router;