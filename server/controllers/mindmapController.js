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
You are a Senior Structural Logic Architect for the Edunova learning platform.

TASK: Generate a visual diagram for the topic: "${topic}".
${domainContext}
SUBJECT AWARENESS: Use the provided 'Subject/Domain' input to adjust your terminology. (e.g., if Subject is 'C Programming', use programming logic; if 'Biology', use biological stages).

The user requested diagram format: "${diagramType}".
If the format is "ai_decide", you MUST choose the best matching format among: "mindmap" (Concept Breakdown), "flowchart" (Step-by-Step Process), or "state" (Lifecycle / Continuous Loop).

OUTPUT FORMAT — You MUST respond with ONLY a valid JSON object. No markdown. No explanation. No text before or after.

The JSON must have exactly this structure:
{
  "suggestedLayout": "TB", 
  "nodes": [{ "id": "1", "type": "input", "data": { "label": "Start" } }],
  "edges": [{ "id": "e1-2", "source": "1", "target": "2", "animated": true }]
}

RULES FOR NODES:
1. Generate 8-15 total nodes for a comprehensive diagram.
2. Every node ID must be a unique string number ("1", "2", "3", ...).
3. Keep labels concise — maximum 5 words per label.
4. NO COORDINATES: NEVER output 'position' or 'x/y' values. The frontend calculates these mathematically.
5. Use type "input" for the starting node, and "default" for the rest.

RULES FOR EDGES:
1. Edge IDs should follow the pattern "e{source}-{target}".
2. CRITICAL: Every 'source' and 'target' value in the 'edges' array MUST exactly match an existing 'id' from the 'nodes' array. All IDs must be strings. If you create an edge, the source and target nodes MUST exist.

DIAGRAM TYPE & CHRONOLOGY GUIDANCE:
- For "mindmap" (Concept Breakdown): Categorize ideas and hierarchy. Set "suggestedLayout": "LR".
- For "flowchart" (Step-by-Step Process): STRICT CHRONOLOGY. You MUST create a linear chain of logic for algorithms, timelines, and procedures. Set "suggestedLayout": "TB".
- For "state" (Lifecycle / Continuous Loop): STRICT CHRONOLOGY. For cycles or states, ensure the final node connects back to the start node. Set "suggestedLayout": "TB".

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.
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

        // Validate shape
        if (!diagramData.nodes || !Array.isArray(diagramData.nodes) || !diagramData.edges || !Array.isArray(diagramData.edges)) {
            return res.json({ success: false, message: "AI response missing nodes or edges arrays." });
        }

        if (diagramData.nodes.length < 3) {
            return res.json({ success: false, message: "AI generated too few nodes. Please try a more specific topic." });
        }

        // Sanitize: ensure all nodes have required fields
        diagramData.nodes = diagramData.nodes.map((node, i) => ({
            id: String(node.id || i + 1),
            type: node.type || "branch",
            data: { label: node.data?.label || `Node ${i + 1}` },
            position: {
                x: Number(node.position?.x) || i * 150,
                y: Number(node.position?.y) || Math.floor(i / 4) * 150,
            },
        }));

        diagramData.edges = diagramData.edges.map((edge) => ({
            id: String(edge.id || `e${edge.source}-${edge.target}`),
            source: String(edge.source),
            target: String(edge.target),
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