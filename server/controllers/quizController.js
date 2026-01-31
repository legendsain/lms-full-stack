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

// 4. Get Single Quiz (UPDATED: Checks for Previous Attempt)
export const getSingleQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // 1. Fetch the Quiz
        const quiz = await Quiz.findById(quizId);
        
        if (!quiz) {
             return res.json({ success: false, message: "Quiz not found" });
        }

        // 2. Check for User Identity (to see if they attempted it)
        let attempt = null;
        if (req.auth && req.auth.userId) {
            const userId = req.auth.userId;
            attempt = await QuizResult.findOne({ quizId, userId });
        }

        // 3. Send back Quiz AND Attempt data
        res.json({ 
            success: true, 
            quiz, 
            attempt // <--- This is the key! If this exists, the UI will show the Score.
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


// 6. Submit Quiz (UPDATED WITH GAMIFICATION ENGINE)
export const submitQuiz = async (req, res) => {
    try {
        const { courseId, quizId, answers } = req.body; 
        const userId = req.auth.userId;

        // 1. Validate User & Quiz existence
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.json({ success: false, message: "Quiz not found" });

        // 2. Prevent Duplicate Attempts (Data Integrity)
        const existingAttempt = await QuizResult.findOne({ quizId, userId });
        if (existingAttempt) {
            return res.json({ success: false, message: "You have already attempted this quiz." });
        }

        // 3. Calculate Score
        // (Ensures backend verifies answers, never trust the frontend)
        let score = 0;
        answers.forEach((selectedOptionIndex, questionIndex) => {
            const question = quiz.questions[questionIndex];
            if (question && question.correctAnswer === Number(selectedOptionIndex)) {
                score++;
            }
        });

        // --- 4. THE REWARD ENGINE ---
        
        // Rule A: Base Points (10 XP per correct answer)
        let earnedPoints = score * 10; 
        
        // Rule B: Perfection Bonus (Flat +50 XP if 100% score)
        let isPerfectScore = false;
        if (score === quiz.questions.length && quiz.questions.length > 0) {
            earnedPoints += 50; 
            isPerfectScore = true;
        }

        // Rule C: Tokens (Currency)
        // For now, 1 XP = 1 Token. You can change this ratio later.
        const earnedTokens = earnedPoints;

        // 5. Update User Stats (ATOMIC UPDATE)
        // We use findByIdAndUpdate with $inc to prevent race conditions
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $inc: { 
                    'gamification.points': earnedPoints,
                    'gamification.tokens': earnedTokens,
                    'gamification.quizzesCompleted': 1
                },
                $set: { 
                    'gamification.lastActivity': new Date() 
                }
            },
            { new: true } // Return the updated user document
        );

        // 6. Save the Quiz Result
        const result = new QuizResult({ 
            userId, 
            courseId, 
            quizId, 
            score, 
            totalQuestions: quiz.questions.length 
        });
        await result.save();

        // 7. Send Response
        res.json({ 
            success: true, 
            message: "Quiz Submitted Successfully",
            score, 
            totalQuestions: quiz.questions.length,
            // Send reward data back so frontend can show "You earned X points!"
            rewards: {
                points: earnedPoints,
                tokens: earnedTokens,
                isPerfectScore
            },
            newTotalTokens: user.gamification.tokens
        });

    } catch (error) {
        console.error("Submit Quiz Error:", error);
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


// 8. Delete Quiz
export const deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Delete the quiz itself
        const quiz = await Quiz.findByIdAndDelete(quizId);
        
        if (!quiz) {
            return res.json({ success: false, message: "Quiz not found" });
        }

        // Optional: Clean up student results for this quiz
        await QuizResult.deleteMany({ quizId });

        res.json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};