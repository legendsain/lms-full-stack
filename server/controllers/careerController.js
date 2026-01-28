import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";

// Initialize a SEPARATE Gemini Client specifically for this feature
// This uses the NEW environment variable
const careerGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CAREER);

export const analyzeCareerGap = async (req, res) => {
    try {
        const { targetRole } = req.body;
        const userId = req.auth.userId;

        if (!targetRole) {
            return res.json({ success: false, message: "Target role is required" });
        }

        // 1. Fetch User's Completed/Enrolled Courses
        const user = await User.findById(userId).populate('enrolledCourses');
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Extract course titles
        const courseList = user.enrolledCourses.map(course => course.courseTitle).join(", ");

        // 2. Prepare AI Prompt
        const model = careerGenAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
            Act as a Career Coach. 
            User wants to be a: "${targetRole}".
            User has completed these courses: "${courseList || 'None yet'}".
            
            Analyze the gap between the user's current skills (based on courses) and the requirements for the target role.
            
            Return ONLY a JSON object. Do not add markdown formatting. Structure:
            {
                "score": (Integer 0-100, readiness score),
                "missingSkills": ["Skill 1", "Skill 2", "Skill 3"],
                "advice": "Short, actionable advice on what to learn next."
            }
        `;

        // 3. Generate Content
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean markdown if AI adds it (e.g. ```json ... ```)
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysisData = JSON.parse(cleanedText);

        res.json({ success: true, analysisData });

    } catch (error) {
        console.error("Career Analysis Error:", error);
        res.json({ success: false, message: error.message });
    }
};