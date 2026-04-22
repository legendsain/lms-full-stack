import { GoogleGenerativeAI } from "@google/generative-ai";
import MindMap from "../models/MindMap.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateMindMap = async (req, res) => {
    try {
        const { topic, diagramType } = req.body; 
        if (!topic) return res.json({ success: false, message: "Topic is required" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // 1. The Common Professional Rulebook (Applies to all)
        const commonRules = `
        You are an Expert Educational Architect for the Edunova platform.
        Your output MUST be ONLY raw, valid Mermaid.js code. NO markdown blocks (\`\`\`mermaid). NO conversational text.
        Use strict indentation with ONLY standard space characters (no \\u00A0).
        Keep nodes concise. Do not over-explain. The goal is visual clarity for students.
        `;

        // 2. The Tailored Prompts
        let specificPrompt = "";

        switch (diagramType) {
            case 'flowchart':
                specificPrompt = `
                ${commonRules}
                TASK: Create a Top-Down Flowchart (graph TD) for the topic: "${topic}".
                
                STRICT FLOWCHART RULES:
                1. Start exactly with: graph TD
                2. NO SPACES IN NODE IDs: Use A, B, C or Node1, Node2.
                3. STRICT ALIASING: You MUST alias every node with brackets. Example: A[Process Start] --> B[Validation]
                4. PREVENT SPAGHETTI: Keep the flow strictly linear or branching downwards. Do not create unnecessary overlapping backward loops.
                5. Conditionals should use diamonds. Example: C{Is Valid?} -- Yes --> D[Proceed]
                `;
                break;

            case 'state':
                specificPrompt = `
                ${commonRules}
                TASK: Create a State Diagram (stateDiagram-v2) for the topic: "${topic}".
                
                STRICT STATE DIAGRAM RULES:
                1. Start exactly with: stateDiagram-v2
                2. Always include a start state: [*] --> s1
                3. STRICT ALIASING: You MUST define multi-word states using quotes and alias them before using them in transitions.
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
                
                STRICT MINDMAP RULES:
                1. Start exactly with: mindmap
                2. NO ARROWS: Do not use --> or any direction logic.
                3. SPACING: Use strict 2-space indentation to define the hierarchy.
                4. ALIASING: You MUST wrap node text containing spaces in parentheses. Example: (My Long Node)
                   Example format:
                   mindmap
                     root((Topic))
                       (Subtopic One)
                         (Detail A)
                       (Subtopic Two)
                `;
                break;
        }

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 15000)
        );

        const result = await Promise.race([ model.generateContent(specificPrompt), timeoutPromise ]);
        let aiResponse = result.response.text();

        // 3. The Universal Sanitizer
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

// ... keep saveMindMap and getCourseMindMaps and deleteMindMap exactly as they are ...
export const saveMindMap = async (req, res) => { /* ... */ };
export const getCourseMindMaps = async (req, res) => { /* ... */ };
export const deleteMindMap = async (req, res) => { /* ... */ };