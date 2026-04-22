import mongoose from "mongoose";

const mindMapSchema = new mongoose.Schema({
    courseId: { type: String, required: true },
    educatorId: { type: String, required: true },
    title: { type: String, required: true },
    mermaidSyntax: { type: String, required: true },
}, { timestamps: true });

const MindMap = mongoose.model("MindMap", mindMapSchema);
export default MindMap;