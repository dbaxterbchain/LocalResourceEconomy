import { Route, Routes } from 'react-router-dom'
import PlaceholderPage from './components/PlaceholderPage'
import PublicLandingPage from './pages/public/PublicLandingPage'
import PublicStartPage from './pages/public/PublicStartPage'
import PublicSectionIntroPage from './pages/public/PublicSectionIntroPage'
import PublicRepeatListPage from './pages/public/PublicRepeatListPage'
import PublicQuestionPage from './pages/public/PublicQuestionPage'
import PublicReviewPage from './pages/public/PublicReviewPage'
import PublicContactPage from './pages/public/PublicContactPage'
import PublicThankYouPage from './pages/public/PublicThankYouPage'
import StaffPreviewPage from './pages/staff/StaffPreviewPage'
import StaffDashboardPage from './pages/staff/StaffDashboardPage'
import StaffResponsesPage from './pages/staff/StaffResponsesPage'
import StaffResponseDetailPage from './pages/staff/StaffResponseDetailPage'
import StaffSurveysPage from './pages/staff/StaffSurveysPage'
import StaffSurveyNewPage from './pages/staff/StaffSurveyNewPage'
import StaffSurveyBuilderPage from './pages/staff/StaffSurveyBuilderPage'
import StaffCohortsPage from './pages/staff/StaffCohortsPage'
import StaffCohortNewPage from './pages/staff/StaffCohortNewPage'
import StaffCohortDetailPage from './pages/staff/StaffCohortDetailPage'
import StaffSurveyLinkPage from './pages/staff/StaffSurveyLinkPage'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PlaceholderPage
            title="Survey Manager"
            description="Use a survey link to access the public survey flow."
          />
        }
      />

      <Route path="/:surveySlug" element={<PublicLandingPage />} />
      <Route path="/:surveySlug/start" element={<PublicStartPage />} />
      <Route path="/:surveySlug/section/:sectionId/intro" element={<PublicSectionIntroPage />} />
      <Route path="/:surveySlug/section/:sectionId/item/:repeatIndex/question/:questionId" element={<PublicQuestionPage />} />
      <Route path="/:surveySlug/section/:sectionId/items" element={<PublicRepeatListPage />} />
      <Route path="/:surveySlug/review" element={<PublicReviewPage />} />
      <Route path="/:surveySlug/contact" element={<PublicContactPage />} />
      <Route path="/:surveySlug/thank-you" element={<PublicThankYouPage />} />

      <Route path="/login" element={<PlaceholderPage title="Staff login" />} />
      <Route path="/app" element={<StaffDashboardPage />} />
      <Route path="/app/surveys" element={<StaffSurveysPage />} />
      <Route path="/app/surveys/new" element={<StaffSurveyNewPage />} />
      <Route path="/app/surveys/:surveyId" element={<StaffSurveyBuilderPage />} />
      <Route path="/app/cohorts" element={<StaffCohortsPage />} />
      <Route path="/app/cohorts/new" element={<StaffCohortNewPage />} />
      <Route path="/app/cohorts/:cohortId" element={<StaffCohortDetailPage />} />
      <Route path="/app/preview" element={<StaffPreviewPage />} />
      <Route path="/app/cohorts/:cohortId/surveys/:surveyId/link" element={<StaffSurveyLinkPage />} />
      <Route path="/app/responses" element={<StaffResponsesPage />} />
      <Route path="/app/responses/:responseId" element={<StaffResponseDetailPage />} />
      <Route path="/app/exports" element={<PlaceholderPage title="Exports" />} />

      <Route path="*" element={<PlaceholderPage title="Not found" />} />
    </Routes>
  )
}
