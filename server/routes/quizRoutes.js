import express from 'express';
import upload from '../configs/multer.js';
import { generateQuiz, saveQuiz, getQuiz, submitQuiz } from '../controllers/quizController.js';
import { protectEducator } from '../middlewares/authMiddleware.js'; // Assuming you have auth middlewares
import { clerkMiddleware, requireAuth } from '@clerk/express';

const quizRouter = express.Router();

// Educator Routes
quizRouter.post('/generate', upload.single('file'), generateQuiz); // Protected in implementation if needed
quizRouter.post('/save', saveQuiz);

// Student Routes
quizRouter.get('/:courseId', getQuiz);
quizRouter.post('/submit', submitQuiz);

export default quizRouter;