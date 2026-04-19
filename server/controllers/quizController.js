import { GoogleGenerativeAI } from "@google/generative-ai";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import User from "../models/User.js";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Quiz (UPDATED FOR PROMPT ENGINEERING & TEACHER NOTES)
export const generateQuiz = async (req, res) => {
    try {
        const file = req.file;
        const { numQuestions, teacherNotes } = req.body; // <-- 1. Extract teacherNotes
        const count = numQuestions || 10;

        if (!file) return res.json({ success: false, message: "No file uploaded" });

        const fileData = fs.readFileSync(file.path);
        const base64Data = fileData.toString("base64");
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // --- 2. ADVANCED DYNAMIC PROMPT (UPDATED FOR STANDALONE QUESTIONS) ---
        let prompt = `You are an expert pedagogical AI assistant. Your task is to review the attached document strictly to identify the overarching subject matter, core concepts, and topics being taught. 
        
        Using those identified topics as a guide, generate exactly ${count} multiple-choice questions. 
        
        CRITICAL INSTRUCTION: The student taking this quiz will NOT have access to the uploaded document. You MUST write the questions as standalone, general-knowledge questions about the subject. You are strictly forbidden from using phrases like "According to the document", "Based on the text", "As stated in the notes", or referring to the author.`;

        // --- NEW: QUOTA-BASED FOCUS TOPIC ENFORCEMENT ---
        if (teacherNotes && teacherNotes.trim() !== "") {
            // Calculate that at least 60% of the questions MUST be about the notes
            const focusCount = Math.max(1, Math.ceil(count * 0.6)); 
            const generalCount = count - focusCount;

            prompt += `
            \n\n==================================================
            ### TEACHER'S FOCUS TOPICS ###
            "${teacherNotes}"
            
            CRITICAL DIRECTIVE: You are required to generate ${count} questions in total. 
            - EXACTLY ${focusCount} of these questions MUST be directly about the "Teacher's Focus Topics" listed above.
            - EXACTLY ${generalCount} of these questions should cover other general foundational knowledge from the document.
            If you ignore this ratio, the test will be invalid.
            ==================================================\n\n`;
        }

        // Add Strict Output Rules
        prompt += `
        Rules for Question Generation:
        1. The questions must test the concepts found in the document, but must be phrased so anyone studying the subject could answer them without reading the specific file.
        2. Provide exactly 4 options.
        3. Do NOT use "All of the above" or "None of the above".
        4. The correctAnswer must exactly match one of the options.

        OUTPUT FORMAT:
        Output ONLY a valid JSON array of objects. Do not include markdown formatting (\`\`\`json), conversational text, or explanations.
        Structure Requirement:
        [
          {
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A"
          }
        ]
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: file.mimetype } },
        ]);

        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const quizData = JSON.parse(cleanedText);

        // Clean up file after success
        fs.unlinkSync(file.path);
        res.json({ success: true, quizData });

    } catch (error) {
        console.error(error);
        // Clean up file if generation fails so it doesn't clutter your server
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.json({ success: false, message: error.message });
    }
};

// 2. Save Quiz 
export const saveQuiz = async (req, res) => {
    try {
        const { courseId, quizId, title, questions, passingPercentage, timeLimit } = req.body;
        
        if (quizId) {
            // Update existing
            await Quiz.findByIdAndUpdate(quizId, { 
                title, 
                questions, 
                passingPercentage, 
                timeLimit: timeLimit || 0 
            });
            res.json({ success: true, message: "Quiz Updated Successfully" });
        } else {
            // Create new
            const newQuiz = new Quiz({ 
                courseId, 
                title, 
                questions, 
                passingPercentage,
                timeLimit: timeLimit || 0 
            });
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
        
        // 1. Fetch the Quiz
        const quiz = await Quiz.findById(quizId);
        
        if (!quiz) {
             return res.json({ success: false, message: "Quiz not found" });
        }

        // 2. Check for User Identity 
        let attempt = null;
        if (req.auth && req.auth.userId) {
            const userId = req.auth.userId;
            attempt = await QuizResult.findOne({ quizId, userId });
        }

        // 3. Send back Quiz AND Attempt data
        res.json({ 
            success: true, 
            quiz, 
            attempt 
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


// 6. Submit Quiz 
export const submitQuiz = async (req, res) => {
    try {
        const { courseId, quizId, answers } = req.body; 
        const userId = req.auth.userId;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.json({ success: false, message: "Quiz not found" });

        const existingAttempt = await QuizResult.findOne({ quizId, userId });
        if (existingAttempt) {
            return res.json({ success: false, message: "You have already attempted this quiz." });
        }

        let score = 0;
        answers.forEach((selectedOptionIndex, questionIndex) => {
            const question = quiz.questions[questionIndex];
            if (question && question.correctAnswer === Number(selectedOptionIndex)) {
                score++;
            }
        });

        // --- THE REWARD ENGINE ---
        let earnedPoints = score * 10; 
        
        let isPerfectScore = false;
        if (score === quiz.questions.length && quiz.questions.length > 0) {
            earnedPoints += 50; 
            isPerfectScore = true;
        }

        const earnedTokens = earnedPoints;

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
            { new: true } 
        );

        const result = new QuizResult({ 
            userId, 
            courseId, 
            quizId, 
            score, 
            totalQuestions: quiz.questions.length 
        });
        await result.save();

        res.json({ 
            success: true, 
            message: "Quiz Submitted Successfully",
            score, 
            totalQuestions: quiz.questions.length,
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

// 7. Get Quiz By Course 
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
        
        const quiz = await Quiz.findByIdAndDelete(quizId);
        
        if (!quiz) {
            return res.json({ success: false, message: "Quiz not found" });
        }

        await QuizResult.deleteMany({ quizId });

        res.json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};