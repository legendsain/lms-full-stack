import { GoogleGenerativeAI } from "@google/generative-ai";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import User from "../models/User.js";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Quiz
export const generateQuiz = async (req, res) => {
    try {
        const file = req.file;
        const { numQuestions } = req.body;
        const count = numQuestions || 10;

        if (!file) return res.json({ success: false, message: "No file uploaded" });

        const fileData = fs.readFileSync(file.path);
        const base64Data = fileData.toString("base64");
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
            You are an educational AI. Analyze the attached document and generate a quiz.
            Output ONLY a valid JSON array of objects. Do not include markdown formatting.
            Structure:
            [
              {
                "question": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option A"
              }
            ]
            Generate exactly ${count} questions.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: file.mimetype } },
        ]);

        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const quizData = JSON.parse(cleanedText);

        fs.unlinkSync(file.path);
        res.json({ success: true, quizData });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Save Quiz
export const saveQuiz = async (req, res) => {
    try {
        const { courseId, quizId, title, questions, passingPercentage } = req.body;
        
        if (quizId) {
            await Quiz.findByIdAndUpdate(quizId, { title, questions, passingPercentage });
            res.json({ success: true, message: "Quiz Updated Successfully" });
        } else {
            const newQuiz = new Quiz({ courseId, title, questions, passingPercentage });
            await newQuiz.save();
            res.json({ success: true, message: "Quiz Created Successfully" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Get All Quizzes
export const getAllQuizzes = async (req, res) => {
    try {
        const { courseId } = req.params;
        const quizzes = await Quiz.find({ courseId }).select('title createdAt questions passingPercentage');
        res.json({ success: true, quizzes });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 4. Get Single Quiz (UPDATED: Checks for previous attempts)
export const getSingleQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.auth.userId; // Get the ID of the student requesting the quiz

        const quiz = await Quiz.findById(quizId);
        
        // Check if this specific user has already finished this quiz
        const attempt = await QuizResult.findOne({ quizId, userId });

        res.json({ 
            success: true, 
            quiz, 
            attempt // Send this back (will be null if not attempted yet)
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// 5. Get Quiz Results
export const getQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;
        const results = await QuizResult.find({ quizId }).sort({ date: -1 });
        const enrichedResults = await Promise.all(results.map(async (result) => {
            const user = await User.findById(result.userId);
            return {
                ...result._doc,
                studentName: user ? user.name : "Unknown Student",
                studentImage: user ? user.imageUrl : "" 
            };
        }));
        res.json({ success: true, results: enrichedResults });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 6. Submit Quiz (UPDATED: Prevents multiple attempts)
export const submitQuiz = async (req, res) => {
    try {
        const { courseId, quizId, answers } = req.body; 
        const userId = req.auth.userId;

        // --- SECURITY CHECK: PREVENT DUPLICATE ATTEMPT ---
        const existingAttempt = await QuizResult.findOne({ quizId, userId });
        if (existingAttempt) {
            return res.json({ success: false, message: "You have already attempted this quiz." });
        }
        // -------------------------------------------------
        
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.json({ success: false, message: "Quiz not found" });

        // Calculate Score
        let score = 0;
        answers.forEach((selectedOptionIndex, questionIndex) => {
            const question = quiz.questions[questionIndex];
            if (question && question.correctAnswer === selectedOptionIndex) {
                score++;
            }
        });

        // --- GAMIFICATION LOGIC (Keep your existing logic here) ---
        const user = await User.findById(userId);
        let earnedPoints = 0;
        earnedPoints += (score * 10);
        if (score === quiz.questions.length && quiz.questions.length > 0) {
            earnedPoints += 50;
        }

        if (user) {
            user.gamification = user.gamification || {};
            user.gamification.points = (user.gamification.points || 0) + earnedPoints;
            user.gamification.tokens = (user.gamification.tokens || 0) + earnedPoints;
            user.gamification.quizzesCompleted = (user.gamification.quizzesCompleted || 0) + 1;
            user.gamification.lastActivity = new Date();
            await user.save();
        }

        // Save Result
        const result = new QuizResult({ userId, courseId, quizId, score, totalQuestions: quiz.questions.length });
        await result.save();

        res.json({ 
            success: true, 
            score, 
            totalQuestions: quiz.questions.length,
            earnedPoints,
            tokens: user.gamification.tokens 
        });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};