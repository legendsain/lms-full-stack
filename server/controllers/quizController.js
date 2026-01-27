import { GoogleGenerativeAI } from "@google/generative-ai";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import User from "../models/User.js";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Quiz (Updated with numQuestions)
export const generateQuiz = async (req, res) => {
    try {
        const file = req.file;
        const { numQuestions } = req.body; // <--- READ INPUT
        const count = numQuestions || 10;  // Default to 10

        if (!file) return res.json({ success: false, message: "No file uploaded" });

        const fileData = fs.readFileSync(file.path);
        const base64Data = fileData.toString("base64");
        
        // Use standard stable model
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

// 2. Save Quiz (Updated with passingPercentage)
export const saveQuiz = async (req, res) => {
    try {
        const { courseId, quizId, title, questions, passingPercentage } = req.body; // <--- READ INPUT
        
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

// ... (Keep getAllQuizzes, getSingleQuiz, getQuizResults, submitQuiz EXACTLY AS THEY WERE) ...
export const getAllQuizzes = async (req, res) => {
    try {
        const { courseId } = req.params;
        const quizzes = await Quiz.find({ courseId }).select('title createdAt questions passingPercentage');
        res.json({ success: true, quizzes });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getSingleQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const quiz = await Quiz.findById(quizId);
        res.json({ success: true, quiz });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

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

export const submitQuiz = async (req, res) => {
    try {
        const { courseId, quizId, answers } = req.body;
        const userId = req.auth.userId;
        const quiz = await Quiz.findById(quizId);
        let score = 0;
        answers.forEach(ans => {
            const question = quiz.questions.find(q => q._id.toString() === ans.questionId);
            if (question && question.correctAnswer === ans.selectedOption) score++;
        });
        const result = new QuizResult({ userId, courseId, quizId, score, totalQuestions: quiz.questions.length });
        await result.save();
        res.json({ success: true, score, totalQuestions: quiz.questions.length });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};