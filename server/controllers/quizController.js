import { GoogleGenerativeAI } from "@google/generative-ai";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import fs from "fs";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Quiz from File (Teacher)
export const generateQuiz = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.json({ success: false, message: "No file uploaded" });

        // Read file as Base64 to send to Gemini
        const fileData = fs.readFileSync(file.path);
        const base64Data = fileData.toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are an educational AI. Analyze the attached document and generate a quiz.
            Output ONLY a valid JSON array of objects. Do not include markdown formatting (like \`\`\`json).
            Structure:
            [
              {
                "question": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option A"
              }
            ]
            Generate 10 questions.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.mimetype,
                },
            },
        ]);

        const responseText = result.response.text();
        // Clean up markdown if Gemini adds it despite instructions
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const quizData = JSON.parse(cleanedText);

        // Delete temp file
        fs.unlinkSync(file.path);

        res.json({ success: true, quizData });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Save Quiz (Teacher)
export const saveQuiz = async (req, res) => {
    try {
        const { courseId, title, questions } = req.body;
        const newQuiz = new Quiz({ courseId, title, questions });
        await newQuiz.save();
        res.json({ success: true, message: "Quiz Saved Successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Get Quiz (Student)
export const getQuiz = async (req, res) => {
    try {
        const { courseId } = req.params;
        const quiz = await Quiz.findOne({ courseId });
        if (!quiz) return res.json({ success: false, message: "No quiz found" });
        res.json({ success: true, quiz });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 4. Submit Quiz (Student)
export const submitQuiz = async (req, res) => {
    try {
        const { courseId, quizId, answers } = req.body;
        const userId = req.auth.userId; // From Clerk

        const quiz = await Quiz.findById(quizId);
        let score = 0;

        // Calculate Score
        answers.forEach(ans => {
            const question = quiz.questions.find(q => q._id.toString() === ans.questionId);
            if (question && question.correctAnswer === ans.selectedOption) {
                score++;
            }
        });

        // Save Result
        const result = new QuizResult({
            userId,
            courseId,
            quizId,
            score,
            totalQuestions: quiz.questions.length
        });
        await result.save();

        res.json({ success: true, score, totalQuestions: quiz.questions.length });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};