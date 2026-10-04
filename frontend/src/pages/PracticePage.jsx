import { useEffect, useState } from "react";

import { useSearchParams } from "react-router-dom";



import {

    getQuestions,

    reportQuestion

} from "../services/api";





const PracticePage = () => {



    const [searchParams] = useSearchParams();





    // ==========================================

    // FILTERS

    // ==========================================



    const subject =

        searchParams.get("subject");



    const plannerTopic =

        searchParams.get("plannerTopic");



    const plannerSubtopic =

        searchParams.get("plannerSubtopic");



    const plannerLocation =

        searchParams.get("plannerLocation");



    const type =

        searchParams.get("type") || "ALL";





    // ==========================================

    // LOCATION DISPLAY

    // ==========================================



    const locationParts =

        plannerLocation

            ? plannerLocation

                .split(">")

                .map(

                    (part) =>

                        part.trim()

                )

                .filter(

                    (part) =>

                        part.length > 0

                )

            : [];





    const displaySubject =

        subject ||

        locationParts[0] ||

        "";





    const displayTitle =

        plannerLocation

            ? locationParts[

                locationParts.length - 1

            ]

            : (

                plannerSubtopic ||

                plannerTopic ||

                subject ||

                "Practice Questions"

            );





    // ==========================================

    // STATE

    // ==========================================



    const [questions, setQuestions] =

        useState([]);



    const [loading, setLoading] =

        useState(true);



    const [error, setError] =

        useState("");





    
    // ==========================================
    // PAGINATION
    // ==========================================

    const [currentPage, setCurrentPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalQuestions, setTotalQuestions] =
        useState(0);

    const QUESTIONS_PER_PAGE = 20;


// ==========================================

    // USER ANSWERS

    // ==========================================



    /*

        Stores the option selected by the user.



        Example:



        {

            "KG-0001": "B",

            "KG-0002": "C"

        }

    */



    const [selectedAnswers, setSelectedAnswers] =

        useState({});





    // ==========================================

    // REPORT STATE

    // ==========================================



    /*

        Stores which question's report panel

        is currently open.

    */



    const [reportingQuestionId, setReportingQuestionId] =

        useState(null);





    /*

        Stores the option selected inside

        the report panel.



        Example:



        {

            "KG-0001": "C"

        }

    */



    const [reportedSelections, setReportedSelections] =

        useState({});





    /*

        Tracks questions currently being

        submitted to the backend.

    */



    const [reportSubmitting, setReportSubmitting] =

        useState({});





    /*

        Stores report success/error messages.

    */



    const [reportMessages, setReportMessages] =

        useState({});





    // ==========================================

    // TYPE LABEL

    // ==========================================



    const getTypeLabel = () => {



        if (

            type ===

            "SCIENTIFIC_ASSISTANT"

        ) {

            return "SSC Scientific Assistant";

        }





        if (type === "PYQ") {

            return "Other PYQs";

        }





        return "All Questions";

    };





    // ==========================================

    // RESET PAGINATION WHEN FILTER CHANGES
    // ==========================================

    useEffect(() => {

        setCurrentPage(1);

    }, [
        subject,
        plannerTopic,
        plannerSubtopic,
        plannerLocation,
        type
    ]);


    // ==========================================
    // FETCH QUESTIONS
    // ==========================================

    useEffect(() => {



        const loadQuestions =

            async () => {



                try {



                    setLoading(true);

                    setError("");





                    /*

                        Clear old selections when

                        the filter changes.

                    */



                    setSelectedAnswers({});

                    setReportingQuestionId(null);

                    setReportedSelections({});

                    setReportMessages({});





                    const data =

                        await getQuestions({



                            subject,



                            plannerTopic,



                            plannerSubtopic,



                            plannerLocation,



                            page: currentPage,

                            limit: QUESTIONS_PER_PAGE,

                            type



                        });





                    setQuestions(

                        data.questions || []

                    );

                    setTotalPages(
                        data.totalPages ||
                        Math.max(
                            1,
                            Math.ceil(
                                (data.totalQuestions || 0) / 20
                            )
                        )
                    );

                    setTotalQuestions(
                        data.totalQuestions || 0
                    );



                } catch (error) {



                    console.error(

                        "Error loading questions:",

                        error

                    );





                    setError(

                        "Failed to load questions."

                    );



                } finally {



                    setLoading(false);



                }



            };





        loadQuestions();





    }, [

        subject,

        plannerTopic,

        plannerSubtopic,

        plannerLocation,

        type,
        currentPage

    ]);





    // ==========================================

    // SELECT ANSWER

    // ==========================================



    const handleAnswerSelect = (

        mcqId,

        option

    ) => {



        /*

            Do not allow changing the answer

            after the question has already been

            answered.



            User can refresh / revisit the page

            if they want to try again.

        */



        if (

            selectedAnswers[mcqId]

        ) {

            return;

        }





        setSelectedAnswers(

            (previous) => ({

                ...previous,



                [mcqId]: option

            })

        );



    };





    // ==========================================

    // OPTION CLASS

    // ==========================================



    const getOptionClass = (

        question,

        option

    ) => {



        const selectedOption =

            selectedAnswers[

                question.mcqId

            ];





        const correctOption =

            question.correctOption;





        /*

            No answer selected yet.

        */



        if (!selectedOption) {



            return (

                "w-full text-left border border-gray-300 " +

                "rounded-lg px-4 py-3 bg-white " +

                "hover:bg-gray-50 hover:border-gray-900 " +

                "transition"

            );



        }





        /*

            Correct option should ALWAYS

            become green after answering.

        */



        if (

            correctOption &&

            option === correctOption

        ) {



            return (

                "w-full text-left border-2 border-green-500 " +

                "rounded-lg px-4 py-3 bg-green-50 " +

                "transition"

            );



        }





        /*

            Selected wrong answer becomes red.

        */



        if (

            option === selectedOption &&

            option !== correctOption

        ) {



            return (

                "w-full text-left border-2 border-red-500 " +

                "rounded-lg px-4 py-3 bg-red-50 " +

                "transition"

            );



        }





        /*

            Other options after answering.

        */



        return (

            "w-full text-left border border-gray-300 " +

            "rounded-lg px-4 py-3 bg-white " +

            "opacity-70 transition"

        );



    };





    // ==========================================

    // OPTION BADGE CLASS

    // ==========================================



    const getOptionBadgeClass = (

        question,

        option

    ) => {



        const selectedOption =

            selectedAnswers[

                question.mcqId

            ];





        const correctOption =

            question.correctOption;





        if (

            selectedOption &&

            correctOption &&

            option === correctOption

        ) {



            return (

                "inline-flex items-center justify-center " +

                "w-7 h-7 mr-3 rounded-md " +

                "bg-green-600 text-white text-xs font-bold"

            );



        }





        if (

            selectedOption === option &&

            option !== correctOption

        ) {



            return (

                "inline-flex items-center justify-center " +

                "w-7 h-7 mr-3 rounded-md " +

                "bg-red-600 text-white text-xs font-bold"

            );



        }





        return (

            "inline-flex items-center justify-center " +

            "w-7 h-7 mr-3 rounded-md " +

            "border border-gray-300 text-xs font-bold"

        );



    };





    // ==========================================

    // ANSWER STATUS

    // ==========================================



    const getAnswerStatus = (

        question

    ) => {



        const selectedOption =

            selectedAnswers[

                question.mcqId

            ];





        /*

            No answer exists in database.

        */



        if (!question.correctOption) {



            return (

                <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg px-4 py-3">



                    <p className="text-sm font-semibold text-yellow-800">



                        Answer unavailable



                    </p>



                    <p className="text-xs text-yellow-700 mt-1">



                        This question currently has no

                        verified working answer.



                    </p>



                </div>

            );



        }





        /*

            User has not selected anything.

        */



        if (!selectedOption) {

            return null;

        }





        /*

            Correct answer.

        */



        if (

            selectedOption ===

            question.correctOption

        ) {



            return (

                <div className="mt-4 border border-green-300 bg-green-50 rounded-lg px-4 py-3">



                    <p className="text-sm font-bold text-green-700">



                        ✓ Correct Answer



                    </p>



                    <p className="text-xs text-green-700 mt-1">



                        You selected the correct option.



                    </p>



                </div>

            );



        }





        /*

            Wrong answer.

        */



        return (

            <div className="mt-4 border border-red-300 bg-red-50 rounded-lg px-4 py-3">



                <p className="text-sm font-bold text-red-700">



                    ✗ Incorrect Answer



                </p>



                <p className="text-xs text-red-700 mt-1">



                    Correct answer:{" "}



                    <span className="font-bold">



                        {question.correctOption}



                    </span>



                </p>



            </div>

        );



    };





    // ==========================================

    // OPEN REPORT PANEL

    // ==========================================



    const openReportPanel = (

        mcqId

    ) => {



        setReportingQuestionId(

            mcqId

        );





        setReportMessages(

            (previous) => ({

                ...previous,

                [mcqId]: ""

            })

        );



    };





    // ==========================================

    // CLOSE REPORT PANEL

    // ==========================================



    const closeReportPanel = () => {



        setReportingQuestionId(null);



    };





    // ==========================================

    // SELECT REPORTED ANSWER

    // ==========================================



    const handleReportedOptionSelect = (

        mcqId,

        option

    ) => {



        setReportedSelections(

            (previous) => ({

                ...previous,

                [mcqId]: option

            })

        );



    };





    // ==========================================

    // SUBMIT REPORT

    // ==========================================



    const handleReportSubmit = async (

        question

    ) => {



        const mcqId =

            question.mcqId;





        const reportedOption =

            reportedSelections[mcqId];





        /*

            Make sure user selected

            an option first.

        */



        if (!reportedOption) {



            setReportMessages(

                (previous) => ({

                    ...previous,



                    [mcqId]:

                        "Please select the correct answer first."

                })

            );



            return;

        }





        try {



            setReportSubmitting(

                (previous) => ({

                    ...previous,

                    [mcqId]: true

                })

            );





            setReportMessages(

                (previous) => ({

                    ...previous,

                    [mcqId]: ""

                })

            );





            const data =

                await reportQuestion(

                    mcqId,

                    reportedOption

                );





            /*

                Update this question locally

                immediately.



                This means the user does not

                need to refresh the page.

            */



            if (

                data &&

                data.question

            ) {



                setQuestions(

                    (previousQuestions) =>

                        previousQuestions.map(

                            (item) => {



                                if (

                                    item.mcqId !==

                                    mcqId

                                ) {

                                    return item;

                                }





                                return {

                                    ...item,



                                    correctOption:

                                        data.question

                                            .correctOption,



                                    answerStatus:

                                        data.question

                                            .answerStatus,



                                    answerSource:

                                        data.question

                                            .answerSource,



                                    originalCorrectOption:

                                        data.question

                                            .originalCorrectOption,



                                    reported:

                                        data.question

                                            .reported,



                                    reportedOption:

                                        data.question

                                            .reportedOption,



                                    reportedAt:

                                        data.question

                                            .reportedAt

                                };



                            }

                        )

                );



            }





            /*

                Show success message.

            */



            setReportMessages(

                (previous) => ({

                    ...previous,



                    [mcqId]:

                       "Answer updated to "+reportedOption+ "."

                })

            );





            /*

                Close report panel after

                successful submission.

            */



            setReportingQuestionId(null);





        } catch (error) {



            console.error(

                "Error reporting question:",

                error

            );





            setReportMessages(

                (previous) => ({

                    ...previous,



                    [mcqId]:

                        error.message ||

                        "Failed to update answer."

                })

            );



        } finally {



            setReportSubmitting(

                (previous) => ({

                    ...previous,

                    [mcqId]: false

                })

            );



        }



    };





    // ==========================================

    // LOADING

    // ==========================================



    if (loading) {



        return (



            <div className="min-h-screen bg-white">



                <div className="max-w-[1180px] mx-auto px-4 py-6">



                    <div className="border border-gray-300 rounded-xl p-6">



                        <h1 className="text-2xl font-bold">



                            Practice Questions



                        </h1>



                        <p className="text-sm text-gray-500 mt-1">



                            Loading questions...



                        </p>



                    </div>



                </div>



            </div>



        );



    }





    // ==========================================

    // ERROR

    // ==========================================



    if (error) {



        return (



            <div className="min-h-screen bg-white">



                <div className="max-w-[1180px] mx-auto px-4 py-6">



                    <div className="border border-red-300 bg-red-50 rounded-xl p-5">



                        <p className="font-semibold text-red-700">



                            {error}



                        </p>



                    </div>



                </div>



            </div>



        );



    }





    // ==========================================

    // PAGE

    // ==========================================



    return (



        <div className="min-h-screen bg-white text-gray-900">



            <div className="max-w-[1180px] mx-auto px-4 sm:px-5 py-6 pb-12">





                {/* ==========================================

                    HEADER

                ========================================== */}



                <div className="border border-gray-300 rounded-xl p-5 sm:p-6">



                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">



                        {displaySubject}



                    </p>





                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">



                        {displayTitle}



                    </h1>





                    {plannerLocation && (



                        <p className="text-xs text-gray-500 mt-2">



                            {plannerLocation}



                        </p>



                    )}





                    <div className="flex flex-wrap items-center gap-2 mt-4">



                        <span className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold">



                            {getTypeLabel()}



                        </span>





                        <span className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600">



                            {totalQuestions} questions



                        </span>



                    </div>



                </div>





                {/* ==========================================

                    PROGRESS

                ========================================== */}



                <div className="border border-gray-300 rounded-lg p-4 mt-3">



                    <div className="flex items-center justify-between text-xs font-bold mb-2">



                        <span>



                            Questions



                        </span>



                        <span>



                            Page {currentPage} of {totalPages}



                        </span>



                    </div>





                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">



                        <div

                            className="h-full bg-gray-900 rounded-full"

                            style={{

                                width:
                                    totalPages > 0
                                        ? ((currentPage / totalPages) * 100) + "%"
                                        : "0%"

                            }}

                        />



                    </div>



                </div>





                {/* ==========================================

                    NO QUESTIONS

                ========================================== */}



                {questions.length === 0 && (



                    <div className="border border-gray-300 rounded-xl p-8 mt-4 text-center">



                        <p className="font-semibold text-gray-800">



                            No questions found.



                        </p>



                        <p className="text-sm text-gray-500 mt-1">



                            There are currently no questions

                            matching this selection.



                        </p>



                    </div>



                )}





                {/* ==========================================

                    QUESTIONS

                ========================================== */}



                <div className="mt-4 space-y-3">



                    {questions.map(

                        (

                            question,

                            index

                        ) => (



                            <div

                                key={

                                    question.mcqId

                                }

                                className="border border-gray-300 rounded-xl bg-white overflow-hidden"

                            >





                                {/* ==========================================

                                    QUESTION HEADER

                                ========================================== */}



                                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">



                                    <span className="text-xs font-bold text-gray-700">



                                        Question{" "}



                                        {index + 1}



                                    </span>





                                    <div className="flex items-center gap-2">



                                        {question.reported && (



                                            <span className="px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 text-[11px] font-bold">



                                                Corrected



                                            </span>



                                        )}





                                        <span className="text-xs font-semibold text-gray-500">



                                            {question.mcqId}



                                        </span>



                                    </div>



                                </div>





                                {/* ==========================================

                                    QUESTION BODY

                                ========================================== */}



                                <div className="p-5">



                                    <h2 className="text-base sm:text-lg font-bold leading-relaxed text-gray-900">



                                        {question.question}



                                    </h2>





                                    {/* ==========================================

                                        OPTIONS

                                    ========================================== */}



                                    <div className="mt-5 space-y-2">



                                        {[

                                            "A",

                                            "B",

                                            "C",

                                            "D"

                                        ].map(

                                            (

                                                option

                                            ) => (



                                                <button

                                                    key={

                                                        option

                                                    }

                                                    type="button"

                                                    onClick={() =>

                                                        handleAnswerSelect(

                                                            question.mcqId,

                                                            option

                                                        )

                                                    }

                                                    disabled={

                                                        Boolean(

                                                            selectedAnswers[

                                                                question.mcqId

                                                            ]

                                                        )

                                                    }

                                                    className={

                                                        getOptionClass(

                                                            question,

                                                            option

                                                        )

                                                    }

                                                >



                                                    <span

                                                        className={

                                                            getOptionBadgeClass(

                                                                question,

                                                                option

                                                            )

                                                        }

                                                    >



                                                        {option}



                                                    </span>





                                                    <span className="text-sm text-gray-800">



                                                        {

                                                            question

                                                                .options?.[

                                                                option

                                                            ] ||

                                                            "Option unavailable"

                                                        }



                                                    </span>



                                                </button>



                                            )

                                        )}



                                    </div>





                                    {/* ==========================================

                                        ANSWER STATUS

                                    ========================================== */}



                                    {getAnswerStatus(

                                        question

                                    )}





                                    {/* ==========================================

                                        CORRECTED ANSWER INFO

                                    ========================================== */}



                                    {question.reported && (



                                        <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg px-4 py-3">



                                            <p className="text-xs font-bold text-yellow-800">



                                                Answer corrected by user



                                            </p>





                                        </div>



                                    )}





                                    {/* ==========================================

                                        REPORT SECTION

                                    ========================================== */}



                                    <div className="mt-5 pt-4 border-t border-gray-200">



                                        <div className="flex flex-wrap items-center justify-between gap-3">



                                            <div>



                                                <p className="text-sm font-semibold text-gray-800">



                                                    Found an incorrect answer?



                                                </p>



                                                <p className="text-xs text-gray-500 mt-0.5">



                                                    Report the correct option.



                                                </p>



                                            </div>





                                            <button

                                                type="button"

                                                onClick={() =>

                                                    openReportPanel(

                                                        question.mcqId

                                                    )

                                                }

                                                className="px-4 py-2 rounded-lg border border-gray-400 bg-white text-sm font-bold text-gray-800 hover:bg-gray-50 hover:border-gray-900 transition"

                                            >



                                                {question.reported

                                                    ? "Correct Again"

                                                    : "Report Answer"}



                                            </button>



                                        </div>





                                        {/* ==========================================

                                            REPORT PANEL

                                        ========================================== */}



                                        {reportingQuestionId ===

                                            question.mcqId && (



                                            <div className="mt-4 border border-gray-300 rounded-xl bg-gray-50 p-4">



                                                <div className="flex items-center justify-between gap-3">



                                                    <div>



                                                        <p className="text-sm font-bold text-gray-900">



                                                            Select the correct answer



                                                        </p>



                                                        <p className="text-xs text-gray-500 mt-1">



                                                            Your correction will immediately

                                                            become the active answer.



                                                        </p>



                                                    </div>





                                                    <button

                                                        type="button"

                                                        onClick={

                                                            closeReportPanel

                                                        }

                                                        className="text-xs font-bold text-gray-500 hover:text-gray-900"

                                                    >



                                                        Close



                                                    </button>



                                                </div>





                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">



                                                    {[

                                                        "A",

                                                        "B",

                                                        "C",

                                                        "D"

                                                    ].map(

                                                        (

                                                            option

                                                        ) => (



                                                            <button

                                                                key={

                                                                    option

                                                                }

                                                                type="button"

                                                                onClick={() =>

                                                                    handleReportedOptionSelect(

                                                                        question.mcqId,

                                                                        option

                                                                    )

                                                                }

                                                                className={

                                                                    reportedSelections[

                                                                        question.mcqId

                                                                    ] ===

                                                                    option

                                                                        ? "border-2 border-gray-900 bg-white rounded-lg px-3 py-2 text-sm font-bold"

                                                                        : "border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm font-semibold hover:border-gray-900"

                                                                }

                                                            >



                                                                <span className="font-bold">



                                                                    {option}



                                                                </span>



                                                                <span className="ml-2 text-xs text-gray-600">



                                                                    {

                                                                        question

                                                                            .options?.[

                                                                            option

                                                                        ] ||

                                                                        "Unavailable"

                                                                    }



                                                                </span>



                                                            </button>



                                                        )

                                                    )}



                                                </div>





                                                <div className="flex flex-wrap items-center gap-2 mt-4">



                                                    <button

                                                        type="button"

                                                        onClick={() =>

                                                            handleReportSubmit(

                                                                question

                                                            )

                                                        }

                                                        disabled={

                                                            Boolean(

                                                                reportSubmitting[

                                                                    question.mcqId

                                                                ]

                                                            )

                                                        }

                                                        className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"

                                                    >



                                                        {reportSubmitting[

                                                            question.mcqId

                                                        ]

                                                            ? "Updating..."

                                                            : "Submit Correction"}



                                                    </button>





                                                    <button

                                                        type="button"

                                                        onClick={

                                                            closeReportPanel

                                                        }

                                                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50"

                                                    >



                                                        Cancel



                                                    </button>



                                                </div>





                                                {reportMessages[

                                                    question.mcqId

                                                ] && (



                                                    <p className="mt-3 text-xs font-semibold text-gray-700">



                                                        {

                                                            reportMessages[

                                                                question.mcqId

                                                            ]

                                                        }



                                                    </p>



                                                )}



                                            </div>



                                        )}





                                        {/* ==========================================

                                            REPORT MESSAGE

                                        ========================================== */}



                                        {reportMessages[

                                            question.mcqId

                                        ] &&

                                            reportingQuestionId !==

                                            question.mcqId && (



                                                <p className="mt-3 text-xs font-semibold text-green-700">



                                                    {

                                                        reportMessages[

                                                            question.mcqId

                                                        ]

                                                    }



                                                </p>



                                            )}



                                    </div>





                                    {/* ==========================================

                                        SOURCE

                                    ========================================== */}



                                    <div className="mt-5 pt-3 border-t border-gray-200 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">



                                        <span>



                                            {

                                                question

                                                    .examMetadata

                                                    ?.exam

                                            }



                                        </span>





                                        {question

                                            .examMetadata

                                            ?.year && (



                                                <span>



                                                    {

                                                        question

                                                            .examMetadata

                                                            .year

                                                    }



                                                </span>



                                            )}



                                    </div>



                                </div>



                            </div>



                        )

                    )}



                


                {/* ==========================================
                    PAGINATION
                ========================================== */}

                {questions.length > 0 && (

                    <div className="mt-8 border-2 border-gray-300 rounded-xl bg-white p-4 sm:p-5 shadow-sm">

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage(
                                        (previous) =>
                                            Math.max(
                                                previous - 1,
                                                1
                                            )
                                    )
                                }
                                disabled={
                                    currentPage === 1
                                }
                                className="w-full sm:w-[140px] px-5 py-3 rounded-lg border border-gray-400 bg-white text-sm font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >

                                ← Previous

                            </button>


                            <div className="text-center">

                                <p className="text-sm font-bold text-gray-900">

                                    Page {currentPage} of {totalPages}

                                </p>

                                <p className="text-xs text-gray-500 mt-1">

                                    {totalQuestions} total questions

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage(
                                        (previous) =>
                                            Math.min(
                                                previous + 1,
                                                totalPages
                                            )
                                    )
                                }
                                disabled={
                                    currentPage === totalPages
                                }
                                className="w-full sm:w-[140px] px-5 py-3 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                            >

                                Next →

                            </button>

                        </div>

                    </div>

                )}</div>



            </div>



        </div>



    );



};





export default PracticePage;