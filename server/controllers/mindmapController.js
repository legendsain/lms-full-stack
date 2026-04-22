import { GoogleGenerativeAI } from "@google/generative-ai";
import MindMap from "../models/MindMap.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Ask Gemini to generate the Mermaid.js syntax
// 1. Ask Gemini to generate the Mermaid.js syntax
export const generateMindMap = async (req, res) => {
    try {
        const { topic } = req.body; 

        if (!topic) return res.json({ success: false, message: "Topic is required" });

        // USE THE HIGHLY STABLE 1.5 FLASH MODEL
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert educational structuralist. Create a comprehensive mind map for the topic: "${topic}".

        CRITICAL RULES:
        1. You MUST output ONLY valid Mermaid.js 'mindmap' syntax.
        2. Do not use markdown wrappers (like \`\`\`mermaid).
        3. Do not include any conversational text or explanations.
        4. Use the strict indentation format required by Mermaid.js.
        5. Keep node text concise (1-4 words). Use parentheses () for standard nodes if needed.

        Example Format:
        mindmap
          root((Topic Name))
            Subtopic 1
              Detail A
              Detail B
            Subtopic 2
              Detail C
        `;

        // --- NEW: STRICT 15-SECOND TIMEOUT TO PREVENT VERCEL 504 HANGS ---
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is busy right now. Please try again in a moment.")), 15000)
        );

        // Race the Gemini API against the 15-second timer
        const result = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise
        ]);

        let aiResponse = result.response.text();

        // Strip markdown if the AI accidentally adds it
        const cleanSyntax = aiResponse.replace(/```mermaid/g, "").replace(/```/g, "").trim();

        res.json({ success: true, mermaidSyntax: cleanSyntax });

    } catch (error) {
        console.error("MindMap Gen Error:", error);
        // This will now catch the 15-second timeout OR actual API errors
        res.json({ success: false, message: error.message });
    }
};

// 2. Save the Mind Map to the Database
export const saveMindMap = async (req, res) => {
    try {
        const { courseId, title, mermaidSyntax } = req.body;
        const educatorId = req.auth.userId;

        const newMindMap = new MindMap({ courseId, educatorId, title, mermaidSyntax });
        await newMindMap.save();

        res.json({ success: true, message: "Mind map published to course!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Fetch Mind Maps for Students/Teachers
export const getCourseMindMaps = async (req, res) => {
    try {
        const { courseId } = req.params;
        const mindMaps = await MindMap.find({ courseId }).sort({ createdAt: -1 });
        res.json({ success: true, mindMaps });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};