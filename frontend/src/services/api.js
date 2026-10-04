const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://10.200.103.103:5000/api";


// ==========================================
// GET PLANNER
// ==========================================

export const getPlanner = async () => {

    const response = await fetch(
        `${API_BASE_URL}/planner`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch planner");
    }

    return await response.json();
};


// ==========================================
// GET QUESTIONS
// ==========================================

export const getQuestions = async ({
    subject,
    plannerTopic,
    plannerSubtopic,
    plannerLocation,
    page = 1,
    limit = 20,
    type,
    exam,
    year,
    sscScientificAssistant
}) => {

    const params = new URLSearchParams();


    // ==========================================
    // PLANNER SUBJECT
    // ==========================================

    if (subject) {

        params.append(
            "subject",
            subject
        );

    }


    // ==========================================
    // PLANNER TOPIC
    // ==========================================

    if (plannerTopic) {

        params.append(
            "plannerTopic",
            plannerTopic
        );

    }


    // ==========================================
    // PLANNER SUBTOPIC
    // ==========================================

    if (plannerSubtopic) {

        params.append(
            "plannerSubtopic",
            plannerSubtopic
        );

    }


    // ==========================================
    // EXACT PLANNER LOCATION
    // ==========================================

    if (plannerLocation) {

        params.append(
            "plannerLocation",
            plannerLocation
        );

    }


    // ==========================================
    // PAGINATION
    // ==========================================

    if (page) {

        params.append(
            "page",
            page
        );

    }


    if (limit) {

        params.append(
            "limit",
            limit
        );

    }


    // ==========================================
    // QUESTION TYPE
    // ==========================================

    if (type) {

        params.append(
            "type",
            type
        );

    }


    // ==========================================
    // EXAM
    // ==========================================

    if (exam) {

        params.append(
            "exam",
            exam
        );

    }


    // ==========================================
    // YEAR
    // ==========================================

    if (year) {

        params.append(
            "year",
            year
        );

    }


    // ==========================================
    // SSC SCIENTIFIC ASSISTANT
    // ==========================================

    if (
        sscScientificAssistant !==
        undefined
    ) {

        params.append(
            "sscScientificAssistant",
            sscScientificAssistant
        );

    }


    // ==========================================
    // API REQUEST
    // ==========================================

    const response = await fetch(
        `${API_BASE_URL}/questions?${params.toString()}`
    );


    if (!response.ok) {

        throw new Error(
            "Failed to fetch questions"
        );

    }


    return await response.json();

};


// ==========================================
// REPORT / CORRECT QUESTION ANSWER
// ==========================================

export const reportQuestion = async (
    mcqId,
    reportedOption
) => {

    const response = await fetch(
        `${API_BASE_URL}/questions/${mcqId}/report`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                reportedOption:
                    reportedOption
            })
        }
    );


    if (!response.ok) {

        const errorData =
            await response.json()
                .catch(() => null);

        throw new Error(
            errorData?.message ||
            "Failed to report question"
        );

    }


    return await response.json();

};