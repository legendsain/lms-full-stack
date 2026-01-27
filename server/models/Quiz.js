import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }], // Array of 4 options
        correctAnswer: { type: String, required: true } // The correct option string
    }],
    createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;