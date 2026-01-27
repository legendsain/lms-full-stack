import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    groupName: { type: String, required: true },
    members: [{
        userId: { type: String, required: true },
        studentName: String,
        studentImage: String,
        score: Number
    }],
    avgScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
export default StudyGroup;