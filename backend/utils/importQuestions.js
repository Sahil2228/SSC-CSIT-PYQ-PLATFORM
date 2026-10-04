const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Question = require("../models/Question");

async function importQuestions() {
    try {
        // ==========================================
        // 1. CONNECT TO MONGODB
        // ==========================================

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");


        // ==========================================
        // 2. READ QUESTION BANK
        // ==========================================

        const questionFilePath = path.join(
            __dirname,
            "../data/STEP_3_Final_Question_Bank_1267_With_Options_Metadata.json"
        );

        const questionFileData = fs.readFileSync(
            questionFilePath,
            "utf-8"
        );

        const jsonData = JSON.parse(
            questionFileData
        );

        const questions = jsonData.questions;

        console.log(
            "\nQuestions found in JSON:",
            questions.length
        );

        if (!Array.isArray(questions)) {
            throw new Error(
                "questions is not an array"
            );
        }

        if (questions.length === 0) {
            throw new Error(
                "No questions found in JSON"
            );
        }


        // ==========================================
        // 3. READ ANSWER KEY
        // ==========================================

        const answerKeyPath = path.join(
            __dirname,
            "../data/answerKey1267.json"
        );

        if (!fs.existsSync(answerKeyPath)) {
            throw new Error(
                "answerKey1267.json not found inside backend/data"
            );
        }

        const answerKeyFileData =
            fs.readFileSync(
                answerKeyPath,
                "utf-8"
            );

        const answerKeyData =
            JSON.parse(
                answerKeyFileData
            );


        // IMPORTANT:
        // answerKey1267.json is an object.
        // The actual answer array is inside:
        //
        // answerKeyData.answers
        //

        const answerKey =
            answerKeyData.answers;

        console.log(
            "Answer key entries:",
            Array.isArray(answerKey)
                ? answerKey.length
                : "undefined"
        );

        if (!Array.isArray(answerKey)) {
            throw new Error(
                "answerKey1267.json must contain an 'answers' array"
            );
        }

        if (answerKey.length === 0) {
            throw new Error(
                "Answer key contains no answers"
            );
        }


        // ==========================================
        // 4. CREATE ANSWER LOOKUP MAP
        // ==========================================

        const answerMap = new Map();

        answerKey.forEach(
            (answer) => {

                if (!answer.mcqId) {
                    return;
                }

                answerMap.set(
                    answer.mcqId,
                    answer
                );
            }
        );

        console.log(
            "Unique answer mappings:",
            answerMap.size
        );


        // ==========================================
        // 5. CONVERT QUESTIONS
        // ==========================================

        const formattedQuestions =
            questions.map(
                (q) => {

                    // ----------------------------------
                    // OPTIONS
                    // ----------------------------------

                    const options = {
                        A: "",
                        B: "",
                        C: "",
                        D: ""
                    };

                    if (
                        Array.isArray(
                            q.options
                        )
                    ) {

                        q.options.forEach(
                            (option) => {

                                if (
                                    option.label &&
                                    option.text &&
                                    ["A", "B", "C", "D"].includes(
                                        option.label
                                    )
                                ) {

                                    options[
                                        option.label
                                    ] = option.text;
                                }

                            }
                        );

                    }


                    // ----------------------------------
                    // PLANNER
                    // ----------------------------------

                    const planner = {

                        subject:
                            q.planner?.subject || "",

                        location:
                            q.planner?.location || "",

                        mappingStatus:
                            q.planner?.mapping_status || ""

                    };


                    // ----------------------------------
                    // ANSWER
                    // ----------------------------------

                    const answer =
                        answerMap.get(
                            q.mcq_id
                        );

                    let correctOption = null;

                    let answerStatus =
                        "UNRESOLVED";

                    let answerSource = null;

                    let sourceQuestionNumber =
                        null;


                    if (answer) {

                        // Only accept actual answer
                        // options A/B/C/D.

                        if (
                            ["A", "B", "C", "D"].includes(
                                answer.correctOption
                            )
                        ) {

                            correctOption =
                                answer.correctOption;

                            answerStatus =
                                "WORKING_KEY";

                            answerSource =
                                answer.answerSource ||
                                null;

                            sourceQuestionNumber =
                                answer.sourceQuestionNumber ||
                                null;

                        }

                    }


                    // ----------------------------------
                    // RETURN QUESTION
                    // ----------------------------------

                    return {

                        mcqId:
                            q.mcq_id,

                        knowledgegateQuestionId:
                            q.knowledgegate_question_id,

                        question:
                            q.question,

                        options:
                            options,


                        // ==============================
                        // ANSWER INFORMATION
                        // ==============================

                        correctOption:
                            correctOption,

                        answerStatus:
                            answerStatus,

                        answerSource:
                            answerSource,

                        sourceQuestionNumber:
                            sourceQuestionNumber,


                        // ==============================
                        // ORIGINAL QUESTION DATA
                        // ==============================

                        source:
                            q.source,

                        examMetadata:
                            q.exam_metadata,

                        knowledgegateTopology:
                            q.knowledgegate_topology,

                        planner:
                            planner,

                        sscScientificAssistant:
                            q.ssc_scientific_assistant,

                        contentFingerprint:
                            q.content_fingerprint

                    };

                }
            );


        // ==========================================
        // 6. VALIDATE QUESTIONS
        // ==========================================

        const invalidQuestions =
            formattedQuestions.filter(
                (q) =>
                    !q.mcqId ||
                    !q.knowledgegateQuestionId ||
                    !q.question
            );


        const incompleteOptions =
            formattedQuestions.filter(
                (q) =>
                    !q.options.A ||
                    !q.options.B ||
                    !q.options.C ||
                    !q.options.D
            );


        console.log(
            "\nInvalid questions:",
            invalidQuestions.length
        );

        console.log(
            "Questions with incomplete options:",
            incompleteOptions.length
        );


        if (
            incompleteOptions.length > 0
        ) {

            console.log(
                "\nQuestions with incomplete options:"
            );

            incompleteOptions.forEach(
                (q) => {

                    console.log(
                        `${q.mcqId}: ${q.question}`
                    );

                }
            );

        }


        if (
            invalidQuestions.length > 0
        ) {

            console.log(
                "\nFirst invalid question:"
            );

            console.log(
                JSON.stringify(
                    invalidQuestions[0],
                    null,
                    2
                )
            );

            throw new Error(
                `Found ${invalidQuestions.length} invalid questions`
            );

        }


        // ==========================================
        // 7. VALIDATE ANSWER COVERAGE
        // ==========================================

        const questionsWithoutAnswerEntry =
            formattedQuestions.filter(
                (q) =>
                    !answerMap.has(
                        q.mcqId
                    )
            );


        console.log(
            "\nQuestions missing from answer key:",
            questionsWithoutAnswerEntry.length
        );


        if (
            questionsWithoutAnswerEntry.length > 0
        ) {

            console.log(
                "\nFirst questions missing from answer key:"
            );

            questionsWithoutAnswerEntry
                .slice(0, 10)
                .forEach(
                    (q) => {

                        console.log(
                            `${q.mcqId}: ${q.question}`
                        );

                    }
                );


            // IMPORTANT:
            // Do not import if the answer key
            // doesn't cover every question.

            throw new Error(
                `Answer key is missing ${questionsWithoutAnswerEntry.length} question(s)`
            );

        }


        // ==========================================
        // 8. ANSWER STATISTICS
        // ==========================================

        const answeredQuestions =
            formattedQuestions.filter(
                (q) =>
                    q.correctOption !== null
            );


        const unresolvedQuestions =
            formattedQuestions.filter(
                (q) =>
                    q.correctOption === null
            );


        console.log(
            "\n=========================================="
        );

        console.log(
            "ANSWER KEY STATISTICS"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "Total questions:",
            formattedQuestions.length
        );

        console.log(
            "Questions with working answer:",
            answeredQuestions.length
        );

        console.log(
            "Questions unresolved:",
            unresolvedQuestions.length
        );


        // ==========================================
        // 9. ANSWER DISTRIBUTION
        // ==========================================

        const answerDistribution = {

            A: 0,
            B: 0,
            C: 0,
            D: 0

        };


        answeredQuestions.forEach(
            (q) => {

                answerDistribution[
                    q.correctOption
                ]++;

            }
        );


        console.log(
            "\nAnswer distribution:"
        );

        console.log(
            "A:",
            answerDistribution.A
        );

        console.log(
            "B:",
            answerDistribution.B
        );

        console.log(
            "C:",
            answerDistribution.C
        );

        console.log(
            "D:",
            answerDistribution.D
        );


        // ==========================================
        // 10. CHECK MAPPING STATUS
        // ==========================================

        const questionsWithMappingStatus =
            formattedQuestions.filter(
                (q) =>
                    q.planner &&
                    q.planner.mappingStatus
            );


        console.log(
            "\nQuestions with mapping status:",
            questionsWithMappingStatus.length
        );


        // ==========================================
        // 11. CHECK REMAINING QUESTIONS
        // ==========================================

        const remainingQuestions =
            formattedQuestions.filter(
                (q) =>
                    q.planner &&
                    q.planner.mappingStatus ===
                    "REMAINING — COMBINED TOPICS"
            );


        console.log(
            "Remaining questions:",
            remainingQuestions.length
        );


        if (
            remainingQuestions.length > 0
        ) {

            console.log(
                "\nRemaining questions:"
            );

            remainingQuestions.forEach(
                (q) => {

                    console.log(
                        `${q.mcqId}: ${q.question}`
                    );

                }
            );

        }


        // ==========================================
        // 12. SHOW SAMPLE QUESTIONS
        // ==========================================

        console.log(
            "\n=========================================="
        );

        console.log(
            "SAMPLE ANSWER MAPPINGS"
        );

        console.log(
            "=========================================="
        );


        formattedQuestions
            .slice(0, 5)
            .forEach(
                (q) => {

                    console.log(
                        `${q.mcqId} -> ${q.correctOption || "UNRESOLVED"}`
                    );

                }
            );


        // ==========================================
        // 13. CLEAR OLD QUESTIONS
        // ==========================================

        console.log(
            "\nClearing existing questions..."
        );

        await Question.deleteMany({});

        console.log(
            "Existing questions cleared"
        );


        // ==========================================
        // 14. INSERT QUESTIONS
        // ==========================================

        await Question.insertMany(
            formattedQuestions
        );

        console.log(
            `Successfully imported ${formattedQuestions.length} questions`
        );


        // ==========================================
        // 15. FINAL DATABASE CHECK
        // ==========================================

        const databaseCount =
            await Question.countDocuments();


        const databaseAnsweredCount =
            await Question.countDocuments({

                correctOption: {
                    $in: [
                        "A",
                        "B",
                        "C",
                        "D"
                    ]
                }

            });


        const databaseUnresolvedCount =
            await Question.countDocuments({

                correctOption: null

            });


        console.log(
            "\n=========================================="
        );

        console.log(
            "DATABASE VERIFICATION"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "Questions in MongoDB:",
            databaseCount
        );

        console.log(
            "Answered questions:",
            databaseAnsweredCount
        );

        console.log(
            "Unresolved questions:",
            databaseUnresolvedCount
        );


        // ==========================================
        // 16. CLOSE CONNECTION
        // ==========================================

        await mongoose.connection.close();

        console.log(
            "\nMongoDB connection closed"
        );

        console.log(
            "\nIMPORT COMPLETED SUCCESSFULLY"
        );


    } catch (error) {

        console.error(
            "\nImport failed:",
            error.message
        );

        if (
            mongoose.connection.readyState !== 0
        ) {

            await mongoose.connection.close();

        }

        process.exit(1);

    }
}


importQuestions();