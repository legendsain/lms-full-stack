import { GoogleGenerativeAI } from "@google/generative-ai";
import MindMap from "../models/MindMap.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate the Diagram Syntax using Gemini
export const generateMindMap = async (req, res) => {
    try {
        const { topic } = req.body; 
        if (!topic) return res.json({ success: false, message: "Topic is required" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `You are an expert technical structuralist for the Edunova learning platform. 
        Create a highly accurate Mermaid.js diagram for the topic: "${topic}".

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

        Example Flowchart Format:
        graph TD
          A[Start Process] --> B{Is Valid?}
          B -- Yes --> C[Execute Task]
          B -- No --> D[Reject Task]

        Example State Diagram Format:
        stateDiagram-v2
          state "New Process" as s1
          state "Ready State" as s2
          state "Running State" as s3
          [*] --> s1
          s1 --> s2 : Admitted
          s2 --> s3 : Dispatch
          s3 --> s2 : Interrupt

        Example Mindmap Format:
        mindmap
          root((Topic Name))
            Subtopic 1
              (Detail A)
              (Detail B)
        `;

        // 15-second timeout to prevent server hangs
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 15000)
        );

        const result = await Promise.race([ model.generateContent(prompt), timeoutPromise ]);
        let aiResponse = result.response.text();

        // Clean up markdown AND replace all invisible non-breaking spaces (\u00A0) with standard spaces
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