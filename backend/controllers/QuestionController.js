const Question = require("../models/Question");


// ==========================================
// ESCAPE REGEX SPECIAL CHARACTERS
// ==========================================

const escapeRegex = (value) => {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};


// ==========================================
// GET QUESTIONS
// PAGINATION + PLANNER + EXAM FILTERS
// ==========================================

const getQuestions = async (req, res) => {

    try {

        // ==========================================
        // 1. PAGINATION
        // ==========================================

        const page =
            parseInt(req.query.page) || 1;

        const limit =
            parseInt(req.query.limit) || 20;

        const safePage =
            page < 1 ? 1 : page;

        const safeLimit =
            limit < 1
                ? 20
                : Math.min(limit, 100);

        const skip =
            (safePage - 1) * safeLimit;


        // ==========================================
        // 2. GET FILTERS
        // ==========================================

        const {
            subject,

            // KnowledgeGate filters
            topic,
            subtopic,

            // Planner filters
            plannerTopic,
            plannerSubtopic,
            plannerLocation,

            // Question type
            type,

            // Other filters
            exam,
            year,

            // Existing compatibility filter
            sscScientificAssistant

        } = req.query;


        const filter = {};


        // ==========================================
        // 3. PLANNER SUBJECT
        // ==========================================

        if (subject) {

            const normalizedSubject =
                subject
                    .replace(/^\d+\.\s*/, "")
                    .trim();

            const escapedSubject =
                escapeRegex(
                    normalizedSubject
                );

            filter["planner.subject"] = {
                $regex:
                    `^(?:\\d+\\.\\s*)?${escapedSubject}$`,
                $options: "i"
            };
        }


        // ==========================================
        // 4. PLANNER TOPIC
        // ==========================================

        if (plannerTopic) {

            const escapedTopic =
                escapeRegex(
                    plannerTopic.trim()
                );

            filter["planner.location"] = {
                $regex:
                    `>\\s*${escapedTopic}(?:\\s*>|$)`,
                $options: "i"
            };
        }


        // ==========================================
        // 5. PLANNER SUBTOPIC
        // ==========================================

        if (plannerSubtopic) {

            const escapedSubtopic =
                escapeRegex(
                    plannerSubtopic.trim()
                );

            filter["planner.location"] = {
                $regex:
                    `>\\s*${escapedSubtopic}\\s*$`,
                $options: "i"
            };
        }


        // ==========================================
        // 5A. EXACT PLANNER LOCATION
        // ==========================================

        /*
            Used by the recursive planner.

            Example:

            5.9 SQL >
            5.9.2 Select, Where, Distinct >
            Where Clause

            This matches ONLY that exact planner path.
        */

        if (plannerLocation) {

            filter["planner.location"] =
                plannerLocation.trim();
        }


        // ==========================================
        // 6. KNOWLEDGEGATE TOPIC
        // ==========================================

        if (topic) {

            filter[
                "knowledgegateTopology.topic"
            ] = topic;
        }


        // ==========================================
        // 7. KNOWLEDGEGATE SUBTOPIC
        // ==========================================

        if (subtopic) {

            filter[
                "knowledgegateTopology.subtopic"
            ] = subtopic;
        }


        // ==========================================
        // 8. QUESTION TYPE
        // ==========================================

        /*
            Supported values:

            type=PYQ

            type=SCIENTIFIC_ASSISTANT

            type=ALL

            If type is not supplied,
            all questions are returned.
        */

        if (type) {

            const normalizedType =
                type
                    .trim()
                    .toUpperCase();


            // --------------------------------------
            // OTHER PYQs
            // --------------------------------------

            if (normalizedType === "PYQ") {

                filter.sscScientificAssistant =
                    false;
            }


            // --------------------------------------
            // SSC SCIENTIFIC ASSISTANT
            // --------------------------------------

            else if (
                normalizedType ===
                "SCIENTIFIC_ASSISTANT"
            ) {

                filter.sscScientificAssistant =
                    true;
            }


            // --------------------------------------
            // ALL
            // --------------------------------------

            else if (
                normalizedType === "ALL"
            ) {

                // Do nothing.
                // All questions remain included.
            }
        }


        // ==========================================
        // 9. EXISTING SSC FILTER
        // ==========================================

        /*
            Keep the old filter working.

            Only apply it if the new `type`
            filter was NOT supplied.

            This prevents two filters from
            conflicting with each other.
        */

        if (
            !type &&
            sscScientificAssistant !== undefined
        ) {

            filter.sscScientificAssistant =
                sscScientificAssistant ===
                "true";
        }


        // ==========================================
        // 10. EXAM
        // ==========================================

        if (exam) {

            filter["examMetadata.exam"] =
                exam;
        }


        // ==========================================
        // 11. YEAR
        // ==========================================

        if (year) {

            filter["examMetadata.year"] =
                year;
        }


        // ==========================================
        // 12. COUNT QUESTIONS
        // ==========================================

        const totalQuestions =
            await Question.countDocuments(
                filter
            );


        // ==========================================
        // 13. FETCH QUESTIONS
        // ==========================================

        const questions =
            await Question.find(filter)
                .skip(skip)
                .limit(safeLimit);


        // ==========================================
        // 14. TOTAL PAGES
        // ==========================================

        const totalPages =
            Math.ceil(
                totalQuestions /
                safeLimit
            );


        // ==========================================
        // 15. RESPONSE
        // ==========================================

        res.status(200).json({

            success: true,

            count:
                questions.length,

            totalQuestions:
                totalQuestions,

            page:
                safePage,

            limit:
                safeLimit,

            totalPages:
                totalPages,


            // --------------------------------------
            // FILTER INFORMATION
            // --------------------------------------

            filters: {

                subject:
                    subject || null,

                topic:
                    topic || null,

                subtopic:
                    subtopic || null,

                plannerTopic:
                    plannerTopic || null,

                plannerSubtopic:
                    plannerSubtopic || null,

                plannerLocation:
                    plannerLocation || null,

                type:
                    type || null,

                exam:
                    exam || null,

                year:
                    year || null,

                sscScientificAssistant:
                    sscScientificAssistant !== undefined
                        ? sscScientificAssistant ===
                          "true"
                        : null

            },


            // --------------------------------------
            // QUESTIONS
            // --------------------------------------

            questions:

                questions.map((question) => {

                    const questionObject =
                        question.toObject();


                    // Add a convenient type field
                    // for the frontend.

                    questionObject.questionType =
                        question.sscScientificAssistant
                            ? "SSC_SCIENTIFIC_ASSISTANT"
                            : "PYQ";


                    return questionObject;

                })

        });


    } catch (error) {

        console.error(
            "Error fetching questions:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch questions"

        });
    }
};


// ==========================================
// GET SINGLE QUESTION BY MCQ ID
// ==========================================

const getQuestionByMcqId = async (
    req,
    res
) => {

    try {

        const {
            mcqId
        } = req.params;


        const question =
            await Question.findOne({

                mcqId:
                    mcqId

            });


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found"

            });

        }


        const questionObject =
            question.toObject();


        questionObject.questionType =
            question.sscScientificAssistant
                ? "SSC_SCIENTIFIC_ASSISTANT"
                : "PYQ";


        res.status(200).json({

            success: true,

            question:
                questionObject

        });


    } catch (error) {

        console.error(
            "Error fetching question:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch question"

        });
    }
};


// ==========================================
// REPORT / CORRECT QUESTION ANSWER
// ==========================================

const reportQuestion = async (
    req,
    res
) => {

    try {

        const {
            mcqId
        } = req.params;

        const {
            reportedOption
        } = req.body;


        // ==========================================
        // 1. VALIDATE OPTION
        // ==========================================

        const validOptions = [
            "A",
            "B",
            "C",
            "D"
        ];


        if (
            !reportedOption ||
            !validOptions.includes(
                reportedOption.toUpperCase()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "reportedOption must be A, B, C, or D"

            });
        }


        const normalizedOption =
            reportedOption.toUpperCase();


        // ==========================================
        // 2. FIND QUESTION
        // ==========================================

        const question =
            await Question.findOne({
                mcqId: mcqId
            });


        if (!question) {

            return res.status(404).json({

                success: false,

                message:
                    "Question not found"

            });
        }


        // ==========================================
        // 3. PRESERVE ORIGINAL ANSWER
        // ==========================================

        
/*
    Save the original imported answer only
    on the first report.

    Future reports are still allowed and can
    freely change the current correct answer.
*/

        if (!question.reported) {

            question.originalCorrectOption =
                question.correctOption;
        }


        // ==========================================
        // 4. UPDATE CURRENT ANSWER
        // ==========================================

        question.correctOption =
            normalizedOption;


        question.answerStatus =
            "USER_CORRECTED";


        question.answerSource =
            "User Report";


        // ==========================================
        // 5. SAVE REPORT INFORMATION
        // ==========================================

        question.reported =
            true;


        question.reportedOption =
            normalizedOption;


        question.reportedAt =
            new Date();


        // ==========================================
        // 6. SAVE TO DATABASE
        // ==========================================

        await question.save();


        // ==========================================
        // 7. RESPONSE
        // ==========================================

        res.status(200).json({

            success: true,

            message:
                "Question answer updated successfully",

            question: {

                mcqId:
                    question.mcqId,

                correctOption:
                    question.correctOption,

                answerStatus:
                    question.answerStatus,

                answerSource:
                    question.answerSource,

                originalCorrectOption:
                    question.originalCorrectOption,

                reported:
                    question.reported,

                reportedOption:
                    question.reportedOption,

                reportedAt:
                    question.reportedAt

            }

        });


    } catch (error) {

        console.error(
            "Error reporting question:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to update question answer"

        });
    }
};


// ==========================================
// GET REMAINING / UNMAPPED QUESTIONS
// ==========================================

const getRemainingQuestions = async (
    req,
    res
) => {

    try {

        const {
            type,
            page,
            limit
        } = req.query;


        const filter = {

            "planner.mappingStatus":
                "REMAINING — COMBINED TOPICS"

        };


        // ==========================================
        // QUESTION TYPE FILTER
        // ==========================================

        if (type) {

            const normalizedType =
                type.trim().toUpperCase();


            if (
                normalizedType ===
                "SCIENTIFIC_ASSISTANT"
            ) {

                filter.sscScientificAssistant =
                    true;
            }


            else if (
                normalizedType ===
                "PYQ"
            ) {

                filter.sscScientificAssistant =
                    false;
            }

        }


        // ==========================================
        // PAGINATION
        // ==========================================

        const safePage =
            Math.max(
                parseInt(page) || 1,
                1
            );


        const safeLimit =
            Math.min(
                Math.max(
                    parseInt(limit) || 20,
                    1
                ),
                100
            );


        const skip =
            (safePage - 1) *
            safeLimit;


        // ==========================================
        // COUNT
        // ==========================================

        const totalQuestions =
            await Question.countDocuments(
                filter
            );


        // ==========================================
        // FETCH
        // ==========================================

        const questions =
            await Question.find(filter)
                .skip(skip)
                .limit(safeLimit);


        // ==========================================
        // TOTAL PAGES
        // ==========================================

        const totalPages =
            Math.ceil(
                totalQuestions /
                safeLimit
            );


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(200).json({

            success: true,

            count:
                questions.length,

            totalQuestions,

            page:
                safePage,

            limit:
                safeLimit,

            totalPages,

            questions:

                questions.map((question) => {

                    const questionObject =
                        question.toObject();


                    questionObject.questionType =
                        question.sscScientificAssistant
                            ? "SSC_SCIENTIFIC_ASSISTANT"
                            : "PYQ";


                    return questionObject;

                })

        });


    } catch (error) {

        console.error(
            "Error fetching remaining questions:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch remaining questions"

        });
    }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    getQuestions,

    getQuestionByMcqId,

    getRemainingQuestions,

    reportQuestion

};