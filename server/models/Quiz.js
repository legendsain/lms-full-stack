import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    
    // --- NEW FIELD ---
    timeLimit: { type: Number, default: 0 }, // 0 means "No Limit"
    // -----------------

    questions: [{
        questionText: String,
        options: [String],
        correctAnswer: Number, // Index of correct option (0-3)
    }]
},{ timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;