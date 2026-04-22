import { GoogleGenerativeAI } from "@google/generative-ai";
import MindMap from "../models/MindMap.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateMindMap = async (req, res) => {
    try {
        const { topic, diagramType } = req.body; 
        if (!topic) return res.json({ success: false, message: "Topic is required" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const commonRules = `
        You are an Expert Educational Architect for the Edunova platform.
        Your output MUST be ONLY raw, valid Mermaid.js code. NO markdown blocks (\`\`\`mermaid). NO conversational text.
        Use strict indentation with ONLY standard space characters (no \\u00A0).
        Keep nodes concise. Do not over-explain.
        `;

        let specificPrompt = "";

        switch (diagramType) {
            case 'flowchart':
                specificPrompt = `
                ${commonRules}
                TASK: Create a Top-Down Flowchart (graph TD) for the topic: "${topic}".
                STRICT RULES:
                1. Start exactly with: graph TD
                2. NO SPACES IN NODE IDs: Use A, B, C etc.
                3. STRICT ALIASING: You MUST alias every node. Example: A[Process Start] --> B[Validation]
                4. PREVENT SPAGHETTI: Keep the flow strictly linear or branching downwards. Do not create crossing backward loops.
                `;
                break;
            case 'state':
                specificPrompt = `
                ${commonRules}
                TASK: Create a State Diagram (stateDiagram-v2) for the topic: "${topic}".
                STRICT RULES:
                1. Start exactly with: stateDiagram-v2
                2. Always include a start state: [*] --> s1
                3. STRICT ALIASING: Define multi-word states using quotes and alias them.
                   Example format:
                   state "Process Started" as s1
                   state "Running" as s2
                   [*] --> s1
                   s1 --> s2 : Dispatch
                `;
                break;
            case 'mindmap':
            default:
                specificPrompt = `
                ${commonRules}
                TASK: Create a Hierarchical Mindmap (mindmap) for the topic: "${topic}".
                STRICT RULES:
                1. Start exactly with: mindmap
                2. NO ARROWS: Do not use --> or any direction logic.
                3. SPACING: Use strict 2-space indentation to define the hierarchy.
                4. ALIASING: You MUST wrap node text containing spaces in parentheses. Example: (My Long Node)
                `;
                break;
        }

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 15000)
        );

        const result = await Promise.race([ model.generateContent(specificPrompt), timeoutPromise ]);
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

export const saveMindMap = async (req, res) => {
    try {
        const { courseId, title, mermaidSyntax } = req.body;
        if (!courseId) return res.json({ success: false, message: "Course ID is missing." });

        const educatorId = req.auth?.userId || "educator_placeholder"; 
        const newMindMap = new MindMap({ courseId, educatorId, title, mermaidSyntax });
        await newMindMap.save();

        res.json({ success: true, message: "Saved successfully!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getCourseMindMaps = async (req, res) => {
    try {
        const { courseId } = req.params;
        const mindMaps = await MindMap.find({ courseId }).sort({ createdAt: -1 });
        res.json({ success: true, mindMaps });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const deleteMindMap = async (req, res) => {
    try {
        const { mapId } = req.params;
        await MindMap.findByIdAndDelete(mapId);
        res.json({ success: true, message: "Diagram deleted successfully!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};