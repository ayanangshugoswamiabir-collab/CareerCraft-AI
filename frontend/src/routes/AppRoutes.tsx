import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import DashboardPage from '../pages/DashboardPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ResumePage from '../pages/ResumePage'
import JDPage from '../pages/JDPage'
import MatchingPage from '../pages/MatchingPage'
import ApplicationsPage from '../pages/ApplicationsPage'
import ResumeTailoringPage from '../pages/ResumeTailoringPage'
import InterviewPrepPage from '../pages/InterviewPrepPage'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={<HomePage />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        {/* Resume Management */}
        <Route
          path="/resumes"
          element={<ResumePage />}
        />

        {/* Job Description Analyzer */}
        <Route
          path="/job-description"
          element={<JDPage />}
        />

        {/* Resume ↔ JD Matching */}
        <Route
          path="/resume-jd-matching"
          element={<MatchingPage />}
        />

        {/* Resume Tailoring */}
        <Route
          path="/resume-tailoring"
          element={<ResumeTailoringPage />}
        />

        {/* AI Interview Prep */}
          <Route
          path="/interview-prep"
          element={<InterviewPrepPage />}
          />

        {/* Job Applications */}
        <Route
          path="/applications"
          element={<ApplicationsPage />}
        />

        {/* 404 */}
        <Route
          path="/404"
          element={<NotFoundPage />}
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={
            <Navigate
              to="/404"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes