const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        mcqId: {
            type: String,
            required: true,
            unique: true
        },

        knowledgegateQuestionId: {
            type: String,
            required: true,
            unique: true
        },

        question: {
            type: String,
            required: true
        },

        options: {
            A: {
                type: String,
                default: ""
            },
            B: {
                type: String,
                default: ""
            },
            C: {
                type: String,
                default: ""
            },
            D: {
                type: String,
                default: ""
            }
        },

        // ==========================================
        // ANSWER INFORMATION
        // ==========================================

        // Current active correct answer
        correctOption: {
            type: String,
            enum: ["A", "B", "C", "D", null],
            default: null
        },

        answerStatus: {
            type: String,
            enum: [
                "WORKING_KEY",
                "USER_CORRECTED",
                "UNRESOLVED"
            ],
            default: "UNRESOLVED"
        },

        answerSource: {
            type: String,
            default: null
        },

        sourceQuestionNumber: {
            type: Number,
            default: null
        },

        // ==========================================
        // ANSWER REPORT / CORRECTION
        // ==========================================

        // Stores the original answer before user correction
        originalCorrectOption: {
            type: String,
            enum: ["A", "B", "C", "D", null],
            default: null
        },

        // True after this MCQ has been reported/corrected
        reported: {
            type: Boolean,
            default: false
        },

        // Option selected by the user while reporting
        reportedOption: {
            type: String,
            enum: ["A", "B", "C", "D", null],
            default: null
        },

        // When the correction was made
        reportedAt: {
            type: Date,
            default: null
        },

        // ==========================================
        // SOURCE INFORMATION
        // ==========================================

        source: {
            type: String,
            default: "KnowledgeGate"
        },

        examMetadata: {
            exam: String,
            examSlug: String,
            year: String,
            cycle: String,
            sittingId: String,
            examQuestionNumber: String,
            section: String,
            visibleSourceLabel: String,
            legacyTag: String,
            rawExamTags: mongoose.Schema.Types.Mixed
        },

        knowledgegateTopology: {
            subject: String,
            topic: String,
            subtopic: String
        },

        planner: {
            subject: String,
            location: String,
            mappingStatus: String
        },

        sscScientificAssistant: {
            type: Boolean,
            default: false
        },

        contentFingerprint: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Question", questionSchema);