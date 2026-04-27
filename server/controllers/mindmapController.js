import { GoogleGenerativeAI } from "@google/generative-ai";
import MindMap from "../models/MindMap.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ====================================================================
// GENERATE DIAGRAM — AI outputs strict React Flow JSON (nodes + edges)
// ====================================================================
export const generateMindMap = async (req, res) => {
    try {
        const { topic, diagramType, subjectDomain } = req.body;
        if (!topic) return res.json({ success: false, message: "Topic is required" });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Build domain context string
        const domainContext = subjectDomain
            ? `The subject domain is: "${subjectDomain}". Use terminology, examples, and concepts specific to this field.`
            : "";

        // ---- THE CORE PROMPT ----
        const prompt = `
You are a Lead Software Architect and Visual Designer for the Edunova learning platform.

TASK: Generate a visual diagram for the topic: "${topic}".
${domainContext}
SUBJECT AWARENESS: Use the provided 'Subject/Domain' input to adjust your terminology. (e.g., if Subject is 'C Programming', use programming logic; if 'Biology', use biological stages).

STRICT CSE GUARDRAILS:
You must strictly restrict topics to Computer Science & Engineering (CSE).
If the topic is non-technical (e.g., Cooking, History, generic non-CS topics), you MUST reject it by returning EXACTLY this JSON:
{ "success": false, "message": "Creation Restricted: Please provide a technical CSE topic." }

AUTHENTIC CONTENT: You MUST cross-reference conceptual models like Cisco's Networking standards, Oracle's DBMS docs, or official ECMA specs to ensure the flow is 100% conceptually correct.

If the topic is valid CSE, generate a high-end, modern diagram.
The user requested diagram format: "${diagramType}".
If the format is "ai_decide", choose the best matching format among: "mindmap" (Concept Breakdown), "flowchart" (Step-by-Step Process), or "state" (Lifecycle / Continuous Loop).

OUTPUT FORMAT: Return ONLY a valid JSON object. No markdown. No explanation.

The JSON must have exactly this structure:
{
  "suggestedLayout": "TB", 
  "nodes": [{ 
    "id": "1", 
    "type": "input", 
    "data": { "label": "🚀 Start Process" },
    "style": { "backgroundColor": "#d1fae5", "borderColor": "#065f46", "color": "#064e3b" }
  }],
  "edges": [{ "id": "e1-2", "source": "1", "target": "2", "type": "smoothstep", "animated": true }]
}

VISUAL DESIGN RULES (CRITICAL):
1. Theming (Nodes): You MUST assign a 'style' object to nodes based on their purpose:
   - Input/Start Nodes: Use a soft emerald background (#d1fae5) with a dark green border (#065f46).
   - Decision/Logic Nodes: Use a light amber background (#fef3c7) with an orange border (#ea580c).
   - Default/Concept Nodes: Use a clean white background (#ffffff) with a thin slate border (#cbd5e1) and subtle box-shadow.
2. Edge Aesthetics: All edges MUST include "type": "smoothstep" or "bezier". Use "animated": true for edges representing data flow or execution paths.
3. Typography: Capitalize labels correctly. Use emojis sparingly but strategically to increase scannability (e.g., 📂 for Storage, ⚡ for Process, ⚙️ for Logic). Keep labels concise (max 5 words).
4. Spacing: Maintain a "breathable" hierarchy so nodes don't overlap. (The frontend auto-layout handles positions, but your structure dictates the hierarchy).

RULES FOR NODES & EDGES:
1. Generate 8-15 total nodes.
2. Node IDs must be unique string numbers ("1", "2"...).
3. Edge IDs must be "e{source}-{target}".
4. NO COORDINATES: NEVER output 'position' or 'x/y' values.
5. CRITICAL: Every 'source' and 'target' in 'edges' MUST exactly match an existing 'id' from 'nodes'.

DIAGRAM TYPE & CHRONOLOGY GUIDANCE:
- For "mindmap": Categorize ideas. Set "suggestedLayout": "LR".
- For "flowchart": STRICT CHRONOLOGY. Linear logic. Set "suggestedLayout": "TB".
- For "state": STRICT CHRONOLOGY. Final node connects back to start. Set "suggestedLayout": "TB".

RESPOND WITH ONLY THE JSON OBJECT.
`;

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 20000)
        );

        const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        let aiResponse = result.response.text();

        // ---- PARSE & VALIDATE ----
        // Strip markdown fences if the model wraps them
        aiResponse = aiResponse
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/gi, "")
            .trim();

        let diagramData;
        try {
            diagramData = JSON.parse(aiResponse);
        } catch (parseError) {
            console.error("AI JSON parse failed. Raw response:", aiResponse);
            return res.json({ success: false, message: "AI returned invalid JSON. Please try again." });
        }

        // Handle strict CSE topic rejection
        if (diagramData.success === false) {
            return res.json(diagramData);
        }

        // Validate shape
        if (!diagramData.nodes || !Array.isArray(diagramData.nodes) || !diagramData.edges || !Array.isArray(diagramData.edges)) {
            return res.json({ success: false, message: "AI response missing nodes or edges arrays." });
        }

        if (diagramData.nodes.length < 3) {
            return res.json({ success: false, message: "AI generated too few nodes. Please try a more specific topic." });
        }

        // Sanitize: ensure all nodes have required fields and styles
        diagramData.nodes = diagramData.nodes.map((node, i) => ({
            id: String(node.id || i + 1),
            type: node.type || "default",
            data: { label: node.data?.label || `Node ${i + 1}` },
            style: node.style || undefined,
            position: {
                x: Number(node.position?.x) || i * 150,
                y: Number(node.position?.y) || Math.floor(i / 4) * 150,
            },
        }));

        diagramData.edges = diagramData.edges.map((edge) => ({
            id: String(edge.id || `e${edge.source}-${edge.target}`),
            source: String(edge.source),
            target: String(edge.target),
            type: edge.type || "smoothstep",
            animated: edge.animated || false,
            style: edge.style || undefined,
        }));

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