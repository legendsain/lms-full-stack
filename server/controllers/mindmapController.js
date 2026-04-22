import { GoogleGenerativeAI } from "@google/generative-ai";
import MindMap from "../models/MindMap.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate the Diagram Syntax using Gemini

export const generateMindMap = async (req, res) => {
    try {
        const { topic } = req.body; 
        if (!topic) return res.json({ success: false, message: "Topic is required" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `You are a Senior Technical Architect and Educational Expert building diagrams for the Edunova learning platform. 
        Your task is to create a highly accurate, professional Mermaid.js diagram for the topic: "${topic}".

        PEDAGOGICAL & PROFESSIONAL STANDARDS (ZERO HALLUCINATION):
        1. Accuracy First: The structural logic must be 100% technically accurate. Do not invent or hallucinate concepts.
        2. Scope & Depth: Do not over-explain or under-explain. Include only the most critical, high-level components and their direct sub-components. Keep it highly digestible for students.
        3. Professional Formatting: Node boxes must be concisely named. Edges (arrows) must be properly labeled ONLY if the transition requires explanation.

        CRITICAL MERMAID SYNTAX RULES:
        1. Choose the MOST pedagogically appropriate diagram type: 'stateDiagram-v2', 'graph TD', or 'mindmap'.
        2. Output ONLY the raw, valid Mermaid.js syntax. NEVER use markdown code blocks (\`\`\`mermaid).
        3. NO SPACES IN NODE IDs: For 'graph TD' and 'stateDiagram-v2', the internal node IDs must be single, alphanumeric words without spaces (e.g., State1, NodeA). 
        4. LABELS WITH SPACES: If a state or node name has multiple words, you MUST use aliasing:
           - For flowcharts ('graph TD'): Use brackets. Example: NodeA[Process Started] --> NodeB[Running State]
           - For state diagrams ('stateDiagram-v2'): Define the state alias first. Example: state "Process Started" as s1
           - For mindmaps ('mindmap'): Use parentheses. Example: (Detail A)
        5. Do not include any conversational text. 
        6. Use strict indentation with ONLY standard space characters (no \\u00A0).
        `;

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 15000)
        );

        const result = await Promise.race([ model.generateContent(prompt), timeoutPromise ]);
        let aiResponse = result.response.text();

        let cleanSyntax = aiResponse
            .replace(/```mermaid/gi, "")
            .replace(/```/g, "")
            .replace(/\u00A0/g, " ") 
            .trim();

        res.json({ success: true, mermaidSyntax: cleanSyntax });
    } catch (error) {
        console.error("Generate Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Save Map to DB
export const saveMindMap = async (req, res) => {
    try {
        const { courseId, title, mermaidSyntax } = req.body;
        // Assuming your auth middleware puts the user ID in req.auth.userId
        const educatorId = req.auth?.userId || "educator_placeholder"; 

        const newMindMap = new MindMap({ courseId, educatorId, title, mermaidSyntax });
        await newMindMap.save();

        res.json({ success: true, message: "Saved successfully!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Get Maps for a Course
export const getCourseMindMaps = async (req, res) => {
    try {
        const { courseId } = req.params;
        const mindMaps = await MindMap.find({ courseId }).sort({ createdAt: -1 });
        res.json({ success: true, mindMaps });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// 4. Delete a Mind Map
export const deleteMindMap = async (req, res) => {
    try {
        const { mapId } = req.params;
        
        // Find the map and delete it
        await MindMap.findByIdAndDelete(mapId);
        
        res.json({ success: true, message: "Diagram deleted successfully!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};