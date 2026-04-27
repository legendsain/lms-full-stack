import MindMap from "../models/MindMap.js";
import { generateMindMapService } from "../services/mindmap.service.js";

// ====================================================================
// GENERATE DIAGRAM — AI outputs strict React Flow JSON (nodes + edges)
// ====================================================================
export const generateMindMap = async (req, res) => {
    try {
        const { topic, diagramType, subjectDomain } = req.body;
        if (!topic) return res.json({ success: false, message: "Topic is required" });

        // Build a combined topic if a domain is provided for better context
        const contextualTopic = subjectDomain ? `${topic} in the context of ${subjectDomain}` : topic;
        
        // Depth heuristic: Flowcharts might be deeper, Mindmaps might be wider.
        const depth = diagramType === 'flowchart' ? 4 : 3;

        // Call the new hardened service
        const diagramData = await generateMindMapService({ 
            topic: contextualTopic, 
            audience: "CS students", 
            goal: "comprehensive technical understanding", 
            depth 
        });

        res.json({ success: true, diagramData });
    } catch (error) {
        console.error("Generate Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// ====================================================================
// SAVE DIAGRAM
// ====================================================================
export const saveMindMap = async (req, res) => {
    try {
        const { courseId, title, diagramData } = req.body;
        if (!courseId) return res.json({ success: false, message: "Course ID is missing." });
        if (!diagramData) return res.json({ success: false, message: "Diagram data is missing." });

        const educatorId = req.auth?.userId || "educator_placeholder";
        const newMindMap = new MindMap({ courseId, educatorId, title, diagramData });
        await newMindMap.save();

        res.json({ success: true, message: "Saved successfully!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ====================================================================
// GET DIAGRAMS FOR A COURSE
// ====================================================================
export const getCourseMindMaps = async (req, res) => {
    try {
        const { courseId } = req.params;
        const mindMaps = await MindMap.find({ courseId }).sort({ createdAt: -1 });
        res.json({ success: true, mindMaps });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ====================================================================
// DELETE DIAGRAM
// ====================================================================
export const deleteMindMap = async (req, res) => {
    try {
        const { mapId } = req.params;
        await MindMap.findByIdAndDelete(mapId);
        res.json({ success: true, message: "Diagram deleted successfully!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};