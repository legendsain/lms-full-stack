import { GoogleGenerativeAI } from "@google/generative-ai";
import MindMap from "../models/MindMap.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate the Mind Map Syntax using Gemini
export const generateMindMap = async (req, res) => {
    try {
        const { topic } = req.body; 
        if (!topic) return res.json({ success: false, message: "Topic is required" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert structuralist for Edunova. Create a comprehensive mind map for the topic: "${topic}".
        CRITICAL RULES:
        1. Output ONLY valid Mermaid.js 'mindmap' syntax.
        2. START your response immediately with the word 'mindmap'. Do NOT use directions like TD or LR.
        3. Do not use markdown code blocks (like \`\`\`mermaid) anywhere.
        4. Do not include any conversational text.
        5. Use strict 2-space indentation.
        6. Keep node text concise. Use parentheses () for nodes with spaces.

        Example Format:
        mindmap
          root((Topic Name))
            Subtopic 1
              (Detail A)
              (Detail B)
            Subtopic 2
              (Detail C)
        `;

        // 15-second timeout to prevent server hangs
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 15000)
        );

        const result = await Promise.race([ model.generateContent(prompt), timeoutPromise ]);
        let aiResponse = result.response.text();

        // Clean up any accidental markdown the AI includes
        let cleanSyntax = aiResponse.replace(/```mermaid/gi, "").replace(/```/g, "").trim();
        if (!cleanSyntax.toLowerCase().startsWith("mindmap")) {
             cleanSyntax = `mindmap\n${cleanSyntax}`;
        }

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