import express from 'express';
import upload from '../configs/multer.js';
// --- 1. Added 'getQuizByCourse' to imports ---
import { 
    generateQuiz, 
    saveQuiz, 
    getAllQuizzes, 
    getSingleQuiz, 
    submitQuiz, 
    getQuizResults, 
    getQuizByCourse,
    deleteQuiz
} from '../controllers/quizController.js';

const quizRouter = express.Router();

// Educator Routes
quizRouter.post('/generate', upload.single('file'), generateQuiz);
quizRouter.post('/save', saveQuiz);

// Retrieve Routes (Educator)
quizRouter.get('/course/:courseId', getAllQuizzes); // Get List of all quizzes
quizRouter.get('/results/:quizId', getQuizResults); // Get Results for One
quizRouter.get('/:quizId', getSingleQuiz);          // Get One specific quiz
quizRouter.delete('/:quizId', deleteQuiz);
// Student Routes
quizRouter.post('/submit', submitQuiz);

// --- 2. Added Student "Get Quiz" Route ---
// We use '/student-course/' prefix to avoid conflict with the '/:quizId' route above
quizRouter.get('/student-course/:courseId', getQuizByCourse); 

export default quizRouter;