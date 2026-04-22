import mongoose from 'mongoose';

const mindMapSchema = new mongoose.Schema({
    courseId: { type: String, required: true, ref: 'Course' },
    educatorId: { type: String, required: true },
    title: { type: String, required: true },
    mermaidSyntax: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('MindMap', mindMapSchema);