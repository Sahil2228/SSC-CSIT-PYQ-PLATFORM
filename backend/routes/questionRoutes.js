const express = require("express");

const router = express.Router();

const {
    getQuestions,
    getQuestionByMcqId,
    getRemainingQuestions,
    reportQuestion
} = require("../controllers/QuestionController");


// ==========================================
// GET ALL / FILTERED QUESTIONS
// ==========================================

router.get(
    "/",
    getQuestions
);


// ==========================================
// GET REMAINING QUESTIONS
// ==========================================

router.get(
    "/remaining",
    getRemainingQuestions
);


// ==========================================
// REPORT / CORRECT QUESTION ANSWER
// ==========================================

router.post(
    "/:mcqId/report",
    reportQuestion
);


// ==========================================
// GET SINGLE QUESTION
// ==========================================

router.get(
    "/:mcqId",
    getQuestionByMcqId
);


module.exports = router;