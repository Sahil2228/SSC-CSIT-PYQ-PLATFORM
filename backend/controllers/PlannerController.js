const Question = require("../models/Question");
const curriculum = require("../data/curriculum.json");


// ==========================================
// NORMALIZE PLANNER PART
// ==========================================

const normalizePlannerPart = (value) => {

    if (!value) {
        return "";
    }

    const text = value
        .trim()
        .replace(/\s+/g, " ");

    const match =
        text.match(/^(\d+(?:\.\d+)*)\s*\.?\s*(.*)$/);

    if (!match) {
        return text.toLowerCase();
    }

    const numberPart = match[1];

    const titlePart =
        match[2]
            .trim()
            .toLowerCase();

    return `${numberPart}|${titlePart}`;
};


// ==========================================
// NORMALIZE COMPLETE LOCATION
// ==========================================

const normalizeLocation = (location) => {

    if (!location) {
        return "";
    }

    return location
        .split(">")
        .map((part) =>
            normalizePlannerPart(part)
        )
        .join(" > ");
};


// ==========================================
// CREATE CURRICULUM NODE
// ==========================================

const createCurriculumNode = (
    curriculumNode,
    parentPath = []
) => {

    const currentPath = [
        ...parentPath,
        curriculumNode.title
    ];

    const children =
        Array.isArray(curriculumNode.children)
            ? curriculumNode.children.map(
                (child) =>
                    createCurriculumNode(
                        child,
                        currentPath
                    )
            )
            : [];

    return {

        name: curriculumNode.title,

        // Questions directly mapped to this node.
        directQuestionCount: 0,

        // Final total including descendants.
        questionCount: 0,

        plannerLocation:
            children.length === 0
                ? currentPath.join(" > ")
                : null,

        children,

        // Internal matching field.
        normalizedLocation:
            normalizeLocation(
                currentPath.join(" > ")
            )

    };
};


// ==========================================
// BUILD NODE LOOKUP
// ==========================================

const buildNodeMap = (
    node,
    nodeMap
) => {

    nodeMap.set(
        node.normalizedLocation,
        node
    );

    node.children.forEach(
        (child) =>
            buildNodeMap(
                child,
                nodeMap
            )
    );
};


// ==========================================
// CALCULATE TOTAL COUNTS
// ==========================================

const calculateQuestionCounts = (node) => {

    let total =
        node.directQuestionCount;

    node.children.forEach(
        (child) => {

            total +=
                calculateQuestionCounts(
                    child
                );

        }
    );

    node.questionCount = total;

    return total;
};


// ==========================================
// CLEAN NODE
// ==========================================

const cleanNode = (node) => {

    return {

        name:
            node.name,

        questionCount:
            node.questionCount,

        plannerLocation:
            node.children.length === 0
                ? node.plannerLocation
                : null,

        children:
            node.children.map(
                cleanNode
            )

    };
};


// ==========================================
// GET PLANNER
// ==========================================

const getPlanner = async (req, res) => {

    try {

        // ==========================================
        // FETCH QUESTION LOCATIONS
        // ==========================================

        const questions =
            await Question.find(
                {},
                {
                    "planner.location": 1
                }
            ).lean();


        // ==========================================
        // BUILD COMPLETE CURRICULUM
        // ==========================================

        const planner =
            curriculum.map(
                (subject) =>
                    createCurriculumNode(
                        subject
                    )
            );


        // ==========================================
        // CREATE LOCATION LOOKUP
        // ==========================================

        const nodeMap = new Map();


        planner.forEach(
            (subject) => {

                buildNodeMap(
                    subject,
                    nodeMap
                );

            }
        );


        // ==========================================
        // ATTACH EVERY QUESTION
        // ==========================================

        let unmatchedQuestions = 0;


        questions.forEach(
            (question) => {

                const location =
                    question.planner?.location;


                if (!location) {

                    unmatchedQuestions++;

                    return;

                }


                const normalizedLocation =
                    normalizeLocation(
                        location
                    );


                const node =
                    nodeMap.get(
                        normalizedLocation
                    );


                if (!node) {

                    unmatchedQuestions++;

                    return;

                }


                /*
                    IMPORTANT:

                    The question can be mapped
                    directly to either:

                    1. A leaf
                    2. A parent curriculum node

                    Both are valid.

                    KG-0699 is an example of #2:

                    1. Engineering Mathematics
                    > 1.10 Statistics

                    "Statistics" is a parent node,
                    so its direct count must be retained.
                */

                node.directQuestionCount++;

            }
        );


        // ==========================================
        // CALCULATE TOTAL COUNTS
        // ==========================================

        planner.forEach(
            (subject) => {

                calculateQuestionCounts(
                    subject
                );

            }
        );


        // ==========================================
        // CLEAN INTERNAL FIELDS
        // ==========================================

        const cleanPlanner =
            planner.map(
                cleanNode
            );


        // ==========================================
        // CURRICULUM STATISTICS
        // ==========================================

        let totalCurriculumItems = 0;

        let totalTrackableTopics = 0;


        const countCurriculumNodes =
            (node) => {

                totalCurriculumItems++;


                if (
                    !node.children ||
                    node.children.length === 0
                ) {

                    totalTrackableTopics++;

                    return;

                }


                node.children.forEach(
                    countCurriculumNodes
                );

            };


        cleanPlanner.forEach(
            countCurriculumNodes
        );


        // ==========================================
        // VERIFY QUESTION TOTAL
        // ==========================================

        const calculatedQuestionTotal =
            cleanPlanner.reduce(
                (total, subject) =>
                    total +
                    subject.questionCount,
                0
            );


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(200).json({

            success: true,

            totalSubjects:
                cleanPlanner.length,

            totalCurriculumItems,

            totalTrackableTopics,

            totalQuestions:
                questions.length,

            calculatedQuestionTotal,

            unmatchedQuestions,

            planner:
                cleanPlanner

        });

    } catch (error) {

        console.error(
            "Error fetching planner:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch planner",

            error:
                error.message

        });

    }

};


module.exports = {
    getPlanner
};