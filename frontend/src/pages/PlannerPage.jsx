import { useEffect, useState } from "react";

import { getPlanner } from "../services/api";

import { useNavigate } from "react-router-dom";

const PLANNER_EXPANDED_STORAGE_KEY = "pyq_planner_expanded_nodes";
const PLANNER_SCROLL_STORAGE_KEY = "pyq_planner_scroll_y";



// ==========================================

// NUMERIC PLANNER SORT

// ==========================================



const getNumberParts = (name) => {

    if (!name) {

        return [];

    }



    const match = name.match(/^\s*(\d+(?:\.\d+)*)/);



    if (!match) {

        return [];

    }



    return match[1]

        .split(".")

        .map((value) => Number(value));

};



const comparePlannerNodes = (a, b) => {

    const aParts = getNumberParts(a.name);

    const bParts = getNumberParts(b.name);



    // ==========================================

    // BOTH HAVE NUMBERS

    // ==========================================



    if (

        aParts.length > 0 &&

        bParts.length > 0

    ) {

        const length = Math.max(

            aParts.length,

            bParts.length

        );



        for (let i = 0; i < length; i++) {

            const aNumber = aParts[i] ?? -1;

            const bNumber = bParts[i] ?? -1;



            if (aNumber !== bNumber) {

                return aNumber - bNumber;

            }

        }



        return a.name.localeCompare(

            b.name,

            undefined,

            {

                sensitivity: "base"

            }

        );

    }



    // ==========================================

    // NUMBERED ITEMS BEFORE NON-NUMBERED ITEMS

    // ==========================================



    if (aParts.length > 0) {

        return -1;

    }



    if (bParts.length > 0) {

        return 1;

    }



    // ==========================================

    // BOTH WITHOUT NUMBERS

    // ==========================================



    return a.name.localeCompare(

        b.name,

        undefined,

        {

            sensitivity: "base"

        }

    );

};



// ==========================================

// SORT COMPLETE PLANNER TREE

// ==========================================



const sortPlannerTree = (nodes) => {

    if (!Array.isArray(nodes)) {

        return [];

    }



    return [...nodes]

        .sort(comparePlannerNodes)

        .map((node) => ({

            ...node,

            children: sortPlannerTree(

                node.children || []

            )

        }));

};



// ==========================================

// RECURSIVE PLANNER NODE

// ==========================================



const PlannerNode = ({

    node,

    level,

    path,

    expandedNodes,

    toggleNode,

    openPractice,

    completedTopics,

    toggleCompletedTopic

}) => {

    const hasChildren =

        Array.isArray(node.children) &&

        node.children.length > 0;



    const nodeKey = path.join(" > ");



    const isOpen =

        expandedNodes.has(nodeKey);



    // ==========================================

    // LEAF NODE

    // ==========================================



    if (!hasChildren) {

        return (

            <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">

                <div className="flex items-center gap-3 px-4 py-3">

                    {/* COMPLETION CHECKBOX */}

                    <label
                        className="flex-shrink-0 flex items-center justify-center cursor-pointer"
                        title={
                            completedTopics.has(nodeKey)
                                ? "Mark as incomplete"
                                : "Mark as completed"
                        }
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={completedTopics.has(nodeKey)}
                            onChange={() =>
                                toggleCompletedTopic(nodeKey)
                            }
                            className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        />
                    </label>


                    {/* LEAF ICON */}

                    <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                    </div>


                    {/* NAME */}

                    <div className="flex-1 min-w-0">
                        <p
                            className={
                                completedTopics.has(nodeKey)
                                    ? "text-sm font-semibold text-gray-500 line-through"
                                    : "text-sm font-semibold text-gray-900"
                            }
                        >
                            {node.name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                            {node.questionCount || 0}{" "}
                            {node.questionCount === 1
                                ? "question"
                                : "questions"}
                        </p>
                    </div>


                    {/* MCQ BUTTON */}

                    {Number(node.questionCount || 0) > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                openPractice(
                                    node,
                                    "ALL"
                                )
                            }
                            className="flex-shrink-0 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition"
                        >
                            MCQ
                        </button>
                    )}

                </div>

            </div>

        );

    }



    // ==========================================

    // PARENT NODE

    // ==========================================



    return (

        <div

            className={

                level === 0

                    ? "border border-gray-300 rounded-xl bg-white overflow-hidden"

                    : "border border-gray-300 rounded-lg bg-white overflow-hidden"

            }

        >

            {/* HEADER */}



            <button

                type="button"

                onClick={() =>

                    toggleNode(nodeKey)

                }

                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"

            >

                {/* ARROW */}



                <span

                    className={`w-6 h-6 flex items-center justify-center rounded-md border text-sm font-bold transition-transform duration-200 ${

                        isOpen

                            ? "rotate-90 bg-gray-900 text-white border-gray-900"

                            : "border-gray-400 text-gray-700"

                    }`}

                >

                    ›

                </span>



                {/* NAME */}



                <div className="flex-1 min-w-0">

                    <p

                        className={

                            level === 0

                                ? "text-base font-bold text-gray-900"

                                : level === 1

                                ? "text-sm font-bold text-gray-900"

                                : "text-sm font-semibold text-gray-900"

                        }

                    >

                        {node.name}

                    </p>

                </div>



                {/* COUNT */}



                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">

                    {node.questionCount || 0}{" "}

                    {node.questionCount === 1

                        ? "question"

                        : "questions"}

                </span>

            </button>



            {/* CHILDREN */}



            {isOpen && (

                <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">

                    {node.children.map(

                        (child, index) => (

                            <PlannerNode

                                key={`${nodeKey}-${child.name}-${index}`}

                                node={child}

                                level={level + 1}

                                path={[

                                    ...path,

                                    child.name

                                ]}

                                expandedNodes={

                                    expandedNodes

                                }

                                toggleNode={

                                    toggleNode

                                }

                                openPractice={

                                    openPractice

                                }

                                                            completedTopics={
                                    completedTopics
                                }
                                toggleCompletedTopic={
                                    toggleCompletedTopic
                                }
                            />

                        )

                    )}

                </div>

            )}

        </div>

    );

};



// ==========================================

// MAIN PLANNER PAGE

// ==========================================



const PlannerPage = () => {

    const [planner, setPlanner] = useState([]);



    const [plannerStats, setPlannerStats] =

        useState({

            totalSubjects: 0,

            totalCurriculumItems: 0,

            totalTrackableTopics: 0,

            totalQuestions: 0

        });



    const [loading, setLoading] =

        useState(true);



    const [error, setError] =

        useState("");



    const [expandedNodes, setExpandedNodes] =
        useState(() => {
            try {
                const saved = sessionStorage.getItem(
                    PLANNER_EXPANDED_STORAGE_KEY
                );

                if (!saved) {
                    return new Set();
                }

                const parsed = JSON.parse(saved);

                return new Set(
                    Array.isArray(parsed)
                        ? parsed
                        : []
                );
            } catch (error) {
                console.error(
                    "Failed to load planner expanded state:",
                    error
                );

                return new Set();
            }
        });



    const [completedTopics, setCompletedTopics] =
        useState(() => {
            try {
                const saved =
                    localStorage.getItem(
                        "pyq_completed_topics"
                    );

                if (!saved) {
                    return new Set();
                }

                const parsed = JSON.parse(saved);

                return new Set(
                    Array.isArray(parsed)
                        ? parsed
                        : []
                );
            } catch (error) {
                console.error(
                    "Failed to load completed topics:",
                    error
                );

                return new Set();
            }
        });

    const navigate = useNavigate();



    // ==========================================

    // LOAD PLANNER

    // ==========================================



    useEffect(() => {

        const loadPlanner = async () => {

            try {

                setLoading(true);

                setError("");



                const data =

                    await getPlanner();



                const sortedPlanner =

                    sortPlannerTree(

                        data.planner || []

                    );



                console.log(

                    "Original Planner:",

                    data.planner

                );



                console.log(

                    "Sorted Planner:",

                    sortedPlanner

                );



                setPlanner(

                    sortedPlanner

                );



                setPlannerStats({

                    totalSubjects:

                        data.totalSubjects ??

                        sortedPlanner.length,



                    totalCurriculumItems:

                        data.totalCurriculumItems ??

                        0,



                    totalTrackableTopics:

                        data.totalTrackableTopics ??

                        0,



                    totalQuestions:

                        data.totalQuestions ??

                        0

                });

            } catch (error) {

                console.error(error);



                setError(

                    "Failed to load planner."

                );

            } finally {

                setLoading(false);

            }

        };



        loadPlanner();

    }, []);



    // ==========================================

    // SAVE COMPLETED TOPICS
    // ==========================================

    useEffect(() => {
        try {
            localStorage.setItem(
                "pyq_completed_topics",
                JSON.stringify(
                    Array.from(completedTopics)
                )
            );
        } catch (error) {
            console.error(
                "Failed to save completed topics:",
                error
            );
        }
    }, [completedTopics]);


    // ==========================================
    // SAVE PLANNER EXPANDED STATE
    // ==========================================

    useEffect(() => {
        try {
            sessionStorage.setItem(
                PLANNER_EXPANDED_STORAGE_KEY,
                JSON.stringify(Array.from(expandedNodes))
            );
        } catch (error) {
            console.error(
                "Failed to save planner expanded state:",
                error
            );
        }
    }, [expandedNodes]);


    // ==========================================
    // RESTORE PLANNER SCROLL POSITION
    // ==========================================

    useEffect(() => {
        if (loading) {
            return;
        }

        try {
            const savedScroll = sessionStorage.getItem(
                PLANNER_SCROLL_STORAGE_KEY
            );

            if (savedScroll === null) {
                return;
            }

            const scrollY = Number(savedScroll);

            if (!Number.isFinite(scrollY)) {
                return;
            }

            requestAnimationFrame(() => {
                window.scrollTo(0, scrollY);
            });
        } catch (error) {
            console.error(
                "Failed to restore planner scroll position:",
                error
            );
        }
    }, [loading]);


    // ==========================================
    // SAVE PLANNER VIEW BEFORE PRACTICE
    // ==========================================

    const savePlannerViewState = () => {
        try {
            sessionStorage.setItem(
                PLANNER_SCROLL_STORAGE_KEY,
                String(window.scrollY)
            );

            sessionStorage.setItem(
                PLANNER_EXPANDED_STORAGE_KEY,
                JSON.stringify(Array.from(expandedNodes))
            );
        } catch (error) {
            console.error(
                "Failed to save planner view state:",
                error
            );
        }
    };


    // ==========================================
    // TOGGLE COMPLETED TOPIC
    // ==========================================

    const toggleCompletedTopic = (nodeKey) => {
        setCompletedTopics((previous) => {
            const next = new Set(previous);

            if (next.has(nodeKey)) {
                next.delete(nodeKey);
            } else {
                next.add(nodeKey);
            }

            return next;
        });
    };


    // TOGGLE NODE

    // ==========================================



    const toggleNode = (nodeKey) => {

        setExpandedNodes(

            (previous) => {

                const next =

                    new Set(previous);



                if (

                    next.has(nodeKey)

                ) {

                    next.delete(nodeKey);

                } else {

                    next.add(nodeKey);

                }



                return next;

            }

        );

    };



    // ==========================================

    // OPEN PRACTICE

    // ==========================================



    const openPractice = (

        node,

        type

    ) => {

        const params =

            new URLSearchParams();



        // Topic-specific MCQ

        if (node?.plannerLocation) {

            params.set(

                "plannerLocation",

                node.plannerLocation

            );

        }



        // Practice type

        params.set(

            "type",

            type

        );



        savePlannerViewState();





        navigate(




            `/practice?${params.toString()}`




        );

    };



    // ==========================================

    // TOP-LEVEL PRACTICE

    // ==========================================



    const openGlobalPractice = (

        type

    ) => {

        const params =

            new URLSearchParams();



        params.set(

            "type",

            type

        );



        savePlannerViewState();





        navigate(




            `/practice?${params.toString()}`




        );

    };



    // ==========================================

    // LOADING

    // ==========================================



    if (loading) {

        return (

            <div className="min-h-screen bg-white">

                <div className="max-w-[1180px] mx-auto px-4 py-8">

                    <div className="border border-gray-300 rounded-xl p-6">

                        <h1 className="text-2xl font-bold text-gray-900">

                            PYQ Practice Planner

                        </h1>



                        <p className="text-sm text-gray-500 mt-1">

                            Loading curriculum...

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

                <div className="max-w-[1180px] mx-auto px-4 py-8">

                    <div className="border border-red-300 rounded-xl p-6 bg-red-50">

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

            <div className="max-w-[1180px] mx-auto px-4 sm:px-5 py-8 pb-12">



                {/* ==========================================

                    HEADER

                ========================================== */}



                <div className="border border-gray-300 rounded-xl p-5 sm:p-6">

                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">

                        PYQ Practice Planner

                    </h1>



                    <p className="text-sm text-gray-500 mt-2">

                        Practice SSC Scientific Assistant

                        and other Computer Science &

                        IT previous-year questions.

                    </p>

                </div>



                {/* ==========================================

                    STATS

                ========================================== */}



                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">



                    {/* SUBJECTS */}



                    <div className="border border-gray-300 rounded-lg p-4 bg-white">

                        <strong className="block text-2xl font-bold text-gray-900">

                            {

                                plannerStats.totalSubjects

                            }

                        </strong>



                        <span className="text-xs text-gray-500">

                            Subjects

                        </span>

                    </div>



                    {/* CURRICULUM ITEMS */}



                    <div className="border border-gray-300 rounded-lg p-4 bg-white">

                        <strong className="block text-2xl font-bold text-gray-900">

                            {

                                plannerStats.totalCurriculumItems

                            }

                        </strong>



                        <span className="text-xs text-gray-500">

                            Curriculum Items

                        </span>

                    </div>



                    {/* TRACKABLE TOPICS */}



                    <div className="border border-gray-300 rounded-lg p-4 bg-white">

                        <strong className="block text-2xl font-bold text-gray-900">

                            {

                                plannerStats.totalTrackableTopics

                            }

                        </strong>



                        <span className="text-xs text-gray-500">

                            Trackable Topics

                        </span>

                    </div>



                    {/* QUESTIONS */}



                    <div className="border border-gray-300 rounded-lg p-4 bg-white">

                        <strong className="block text-2xl font-bold text-gray-900">

                            {

                                plannerStats.totalQuestions

                            }

                        </strong>



                        <span className="text-xs text-gray-500">

                            Questions

                        </span>

                    </div>

                </div>



                {/* ==========================================

                    GLOBAL PRACTICE SECTION

                ========================================== */}



                <div className="mt-6">



                    <div className="mb-3">

                        <h2 className="text-lg font-bold text-gray-900">

                            Question Bank

                        </h2>



                        <p className="text-xs text-gray-500 mt-1">

                            Choose what type of questions

                            you want to practice.

                        </p>

                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">



                        {/* ALL QUESTIONS */}



                        <button

                            type="button"

                            onClick={() =>

                                openGlobalPractice(

                                    "ALL"

                                )

                            }

                            className="text-left border border-gray-300 rounded-xl p-4 bg-white hover:bg-gray-50 hover:border-gray-900 transition"

                        >

                            <div className="flex items-center justify-between gap-3">

                                <h3 className="text-sm font-bold text-gray-900">

                                    All Questions

                                </h3>



                                <span className="text-xs font-semibold text-gray-500">

                                    1267

                                </span>

                            </div>



                            <p className="text-xs text-gray-500 mt-2">

                                Practice the complete

                                question bank.

                            </p>

                        </button>



                        {/* PYQ */}



                        <button

                            type="button"

                            onClick={() =>

                                openGlobalPractice(

                                    "PYQ"

                                )

                            }

                            className="text-left border border-gray-300 rounded-xl p-4 bg-white hover:bg-gray-50 hover:border-gray-900 transition"

                        >

                            <div className="flex items-center justify-between gap-3">

                                <h3 className="text-sm font-bold text-gray-900">

                                    PYQ

                                </h3>



                                <span className="text-xs font-semibold text-gray-500">

                                    1016

                                </span>

                            </div>



                            <p className="text-xs text-gray-500 mt-2">

                                Practice PYQs excluding

                                SSC Scientific Assistant.

                            </p>

                        </button>



                        {/* SSC SCIENTIFIC ASSISTANT */}



                        <button

                            type="button"

                            onClick={() =>

                                openGlobalPractice(

                                    "SCIENTIFIC_ASSISTANT"

                                )

                            }

                            className="text-left border border-gray-300 rounded-xl p-4 bg-white hover:bg-gray-50 hover:border-gray-900 transition"

                        >

                            <div className="flex items-center justify-between gap-3">

                                <h3 className="text-sm font-bold text-gray-900">

                                    SSC Scientific Assistant

                                </h3>



                                <span className="text-xs font-semibold text-gray-500">

                                    251

                                </span>

                            </div>



                            <p className="text-xs text-gray-500 mt-2">

                                Practice SSC Scientific

                                Assistant PYQs.

                            </p>

                        </button>

                    </div>

                </div>



                {/* ==========================================

                    QUESTION BANK COVERAGE

                ========================================== */}



                <div className="border border-gray-300 rounded-lg p-4 mt-4">

                    <div className="flex items-center justify-between text-xs font-bold mb-2">

                        <span>

                            Question Bank Coverage

                        </span>



                        <span>

                            {

                                plannerStats.totalQuestions

                            }{" "}

                            / 1267

                        </span>

                    </div>



                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

                        <div

                            className="h-full bg-gray-900 rounded-full"

                            style={{

                                width: `${Math.min(

                                    (

                                        plannerStats.totalQuestions /

                                        1267

                                    ) *

                                        100,

                                    100

                                )}%`

                            }}

                        />

                    </div>

                </div>



                {/* ==========================================

                    CURRICULUM HEADER

                ========================================== */}



                <div className="mt-7 mb-3">

                    <h2 className="text-lg font-bold text-gray-900">

                        Full Curriculum

                    </h2>



                    <p className="text-xs text-gray-500 mt-1">

                        Select a topic and use MCQ to

                        practice questions from that

                        specific topic.

                    </p>

                </div>



                {/* ==========================================

                    PLANNER TREE

                ========================================== */}



                <div className="space-y-2">

                    {planner.map(

                        (node, index) => (

                            <PlannerNode

                                key={`${node.name}-${index}`}

                                node={node}

                                level={0}

                                path={[

                                    node.name

                                ]}

                                expandedNodes={

                                    expandedNodes

                                }

                                toggleNode={

                                    toggleNode

                                }

                                openPractice={

                                    openPractice

                                }

                                                            completedTopics={
                                    completedTopics
                                }
                                toggleCompletedTopic={
                                    toggleCompletedTopic
                                }
                            />

                        )

                    )}

                </div>

            </div>

        </div>

    );

};



export default PlannerPage;