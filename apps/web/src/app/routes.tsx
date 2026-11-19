import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Shell from './Shell'
import AccountPage from '../features/account/AccountPage'
import Home from '../features/home/Home'
import Curriculum from '../features/curriculum/Curriculum'
import ProgressPage from '../features/progress/ProgressPage'

const LessonPage = lazy(() => import('../features/lessons/LessonPage'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="curriculum" element={<Curriculum />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="login" element={<AccountPage mode="login" />} />
        <Route path="register" element={<AccountPage mode="register" />} />
        <Route path="account" element={<AccountPage mode="account" />} />
        <Route
          path="lessons/:slug"
          element={
            <Suspense
              fallback={<div className="wrap skeleton" role="status" aria-label="Opening lesson" />}
            >
              <LessonPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <div className="wrap page-title py-16">
              <h1 className="display-heading">Page not found.</h1>
              <Link className="text-link" to="/curriculum">
                Browse the curriculum →
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  )
}
