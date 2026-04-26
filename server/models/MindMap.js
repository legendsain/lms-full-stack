import mongoose from "mongoose";

const mindMapSchema = new mongoose.Schema({
    courseId: { type: String, required: true },
    educatorId: { type: String, required: true },
    title: { type: String, required: true },
    // Stores React Flow JSON: { nodes: [...], edges: [...] }
    diagramData: { type: mongoose.Schema.Types.Mixed, required: true },
    // Keep legacy field for backward-compat reads (optional)
    mermaidSyntax: { type: String, default: null },
}, { timestamps: true });

const MindMap = mongoose.model("MindMap", mindMapSchema);
export default MindMap;