import express from 'express';
import upload from '../configs/multer.js';
import { generateQuiz, saveQuiz, getAllQuizzes, getSingleQuiz, submitQuiz, getQuizResults } from '../controllers/quizController.js';

const quizRouter = express.Router();

// Educator Routes
quizRouter.post('/generate', upload.single('file'), generateQuiz);
quizRouter.post('/save', saveQuiz);

// Retrieve Routes
quizRouter.get('/course/:courseId', getAllQuizzes); // Get List
quizRouter.get('/:quizId', getSingleQuiz);          // Get One
quizRouter.get('/results/:quizId', getQuizResults); // Get Results for One

// Student Routes
quizRouter.post('/submit', submitQuiz);

export default quizRouter;