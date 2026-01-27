import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    passingPercentage: { type: Number, default: 50 }, // <--- NEW FIELD
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;