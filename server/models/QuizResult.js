import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Store Clerk User ID
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: [{ // Optional: Store what the student answered
        questionId: String,
        selectedOption: String,
        isCorrect: Boolean
    }],
    date: { type: Date, default: Date.now }
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);
export default QuizResult;