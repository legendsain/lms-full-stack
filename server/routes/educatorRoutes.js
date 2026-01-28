import express from 'express'
import { 
    addCourse, 
    educatorDashboardData, 
    getEducatorCourses, 
    getEnrolledStudentsData, 
    updateRoleToEducator, 
    updateCourse,
    deleteCourse,
    getEducatorCourse // <--- 1. NEW IMPORT
} from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router()

// Add Educator Role 
educatorRouter.get('/update-role', updateRoleToEducator)

// Add Courses 
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)

// Get Educator Courses 
educatorRouter.get('/courses', protectEducator, getEducatorCourses)

// Get Single Course (For Editing - Returns Full Data)
educatorRouter.get('/course/:id', protectEducator, getEducatorCourse) // <--- 2. NEW ROUTE

// Get Educator Dashboard Data
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)

// Get Educator Students Data
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)

// Update Course
educatorRouter.post('/update-course', upload.single('image'), protectEducator, updateCourse);

// Delete Course
educatorRouter.delete('/delete-course/:id', protectEducator, deleteCourse);

export default educatorRouter;