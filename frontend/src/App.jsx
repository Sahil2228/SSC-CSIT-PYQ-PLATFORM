import { BrowserRouter, Routes, Route } from "react-router-dom";

import PlannerPage from "./pages/PlannerPage";
import PracticePage from "./pages/PracticePage";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<PlannerPage />}
                />

                <Route
                    path="/planner"
                    element={<PlannerPage />}
                />

                <Route
                    path="/practice"
                    element={<PracticePage />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;