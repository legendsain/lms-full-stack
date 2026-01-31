import React from 'react'
import { Routes, Route, useMatch } from 'react-router-dom'
import Navbar from './components/student/Navbar'
import Home from './pages/student/Home'
import CourseDetails from './pages/student/CourseDetails'
import CoursesList from './pages/student/CoursesList'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import Educator from './pages/educator/Educator'
import 'quill/dist/quill.snow.css'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify'
import Player from './pages/student/Player'
import MyEnrollments from './pages/student/MyEnrollments'
import Loading from './components/student/Loading'
import ManageQuiz from './pages/educator/ManageQuiz'
import QuizPlayer from './pages/student/QuizPlayer'
import StudentTeams from './pages/student/StudentTeams'
import GroupGenerator from './pages/educator/GroupGenerator'
import CareerDashboard from './pages/student/CareerDashboard' 
import StudentQuizList from './pages/student/StudentQuizList' // <--- 1. NEW IMPORT
import Leaderboard from './pages/student/Leaderboard'
const App = () => {

  const isEducatorRoute = useMatch('/educator/*');

  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer />
      
      {/* Render Student Navbar only if not on educator routes */}
      {!isEducatorRoute && <Navbar />}
      
      <Routes>
        {/* --- STUDENT ROUTES --- */}
        <Route path="/" element={<Home />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/course-list/:input" element={<CoursesList />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />
        <Route path="/career-dashboard" element={<CareerDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        {/* --- UPDATED QUIZ ROUTES --- */}
        {/* 1. Show List of Quizzes for a Course */}
        <Route path="/course/quizzes/:courseId" element={<StudentQuizList />} />
        
        {/* 2. Play a Specific Quiz (using quizId) */}
        <Route path="/course/quiz/:quizId" element={<QuizPlayer />} />
        
        {/* Teams Route */}
        <Route path="/student/teams/:courseId" element={<StudentTeams />} />


        {/* --- EDUCATOR ROUTES --- */}
        <Route path='/educator' element={<Educator />}>
          <Route path='/educator' element={<Dashboard />} />
          <Route path='add-course' element={<AddCourse />} />
          <Route path='edit-course/:courseId' element={<AddCourse />} />
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='student-enrolled' element={<StudentsEnrolled />} />
          
          {/* Educator Quiz & Group Routes */}
          <Route path='quiz/:courseId' element={<ManageQuiz />} />
          <Route path='groups/:courseId' element={<GroupGenerator />} />
        </Route>

      </Routes>
    </div>
  )
}

export default App