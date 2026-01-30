import { GoogleGenerativeAI } from "@google/generative-ai";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import User from "../models/User.js";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Quiz (No changes needed here)
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

// 2. Save Quiz (UPDATED TO SAVE TIME LIMIT)
export const saveQuiz = async (req, res) => {
    try {
        // --- ADDED timeLimit HERE ---
        const { courseId, quizId, title, questions, passingPercentage, timeLimit } = req.body;
        
        if (quizId) {
            // Update existing
            await Quiz.findByIdAndUpdate(quizId, { 
                title, 
                questions, 
                passingPercentage, 
                timeLimit: timeLimit || 0 // Save it (default 0)
            });
            res.json({ success: true, message: "Quiz Updated Successfully" });
        } else {
            // Create new
            const newQuiz = new Quiz({ 
                courseId, 
                title, 
                questions, 
                passingPercentage,
                timeLimit: timeLimit || 0 // Save it (default 0)
            });
            await newQuiz.save();
            res.json({ success: true, message: "Quiz Created Successfully" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Get All Quizzes (UPDATED TO FETCH TIME LIMIT)
export const getAllQuizzes = async (req, res) => {
    try {
        const { courseId } = req.params;
        // --- ADDED timeLimit to selection ---
        const quizzes = await Quiz.find({ courseId }).select('title createdAt questions passingPercentage timeLimit');
        res.json({ success: true, quizzes });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 4. Get Single Quiz
export const getSingleQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const quiz = await Quiz.findById(quizId);
        res.json({ success: true, quiz });
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

// 6. Submit Quiz
export const submitQuiz = async (req, res) => {
    try {
        const { courseId, quizId, answers } = req.body;
        const userId = req.auth.userId;
        
        // Check for duplicate attempt
        const existingAttempt = await QuizResult.findOne({ quizId, userId });
        if (existingAttempt) {
            return res.json({ success: false, message: "You have already attempted this quiz." });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.json({ success: false, message: "Quiz not found" });

        let score = 0;
        answers.forEach((selectedOptionIndex, questionIndex) => {
            const question = quiz.questions[questionIndex];
            if (question && question.correctAnswer === selectedOptionIndex) {
                score++;
            }
        });

        // Gamification
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

// 7. Get Quiz By Course (For Students) - NOT USED IN NEW FLOW BUT GOOD TO KEEP
export const getQuizByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.auth.userId;
        const quiz = await Quiz.findOne({ courseId }).sort({ createdAt: -1 });

        if (!quiz) {
            return res.json({ success: false, message: "No quiz found for this course." });
        }
        const attempt = await QuizResult.findOne({ quizId: quiz._id, userId });
        res.json({ success: true, quiz, attempt });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};