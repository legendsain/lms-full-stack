import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import QuizResult from "../models/QuizResult.js";
import { CourseProgress } from "../models/CourseProgress.js";
import Course from "../models/Course.js";

// Initialize Gemini Client
const careerGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CAREER);

export const analyzeCareerGap = async (req, res) => {
    try {
        const { targetRole } = req.body;
        const userId = req.auth.userId;

        if (!targetRole) {
            return res.json({ success: false, message: "Target role is required" });
        }

        // ================================================================
        // 1. FETCH ALL STUDENT DATA FROM MONGODB
        // ================================================================

        // Fetch user with populated course data
        const user = await User.findById(userId).populate('enrolledCourses');

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Fetch all quiz results for this student
        const quizResults = await QuizResult.find({ userId }).populate('courseId', 'courseTitle');

        // Fetch course progress for all enrolled courses
        const progressData = await CourseProgress.find({ userId });

        // ================================================================
        // 2. BUILD RICH STUDENT PROFILE FOR AI
        // ================================================================

        // -- Course Performance Summary --
        const enrolledCourses = user.enrolledCourses || [];
        const coursePerformance = enrolledCourses.map(course => {
            // Find quiz results for this course
            const courseQuizzes = quizResults.filter(
                qr => qr.courseId && qr.courseId._id.toString() === course._id.toString()
            );

            // Calculate average quiz score for this course
            let avgScore = null;
            if (courseQuizzes.length > 0) {
                const totalPercent = courseQuizzes.reduce(
                    (sum, qr) => sum + (qr.score / qr.totalQuestions) * 100, 0
                );
                avgScore = Math.round(totalPercent / courseQuizzes.length);
            }

            // Find course progress (completion rate)
            const progress = progressData.find(
                p => p.courseId === course._id.toString()
            );

            // Count total lectures in this course
            let totalLectures = 0;
            if (course.courseContent) {
                course.courseContent.forEach(ch => {
                    totalLectures += ch.chapterContent ? ch.chapterContent.length : 0;
                });
            }

            const completedLectures = progress ? progress.lectureCompleted.length : 0;
            const completionRate = totalLectures > 0
                ? Math.round((completedLectures / totalLectures) * 100)
                : 0;

            // Determine performance tier
            let performanceTier = "not started";
            if (avgScore !== null) {
                if (avgScore >= 80) performanceTier = "excellent";
                else if (avgScore >= 60) performanceTier = "good";
                else if (avgScore >= 40) performanceTier = "struggling";
                else performanceTier = "poor";
            } else if (completionRate > 0) {
                performanceTier = "in progress (no quizzes taken)";
            }

            return {
                title: course.courseTitle,
                completionRate: `${completionRate}%`,
                avgQuizScore: avgScore !== null ? `${avgScore}%` : "N/A",
                quizzesTaken: courseQuizzes.length,
                performance: performanceTier,
            };
        });

        // -- Overall Stats --
        const overallStats = {
            totalCoursesEnrolled: enrolledCourses.length,
            totalQuizzesCompleted: user.gamification?.quizzesCompleted || 0,
            totalXP: user.gamification?.points || 0,
        };

        // -- Identify strongest and weakest courses --
        const scoredCourses = coursePerformance.filter(c => c.avgQuizScore !== "N/A");
        const strongest = scoredCourses.length > 0
            ? scoredCourses.reduce((best, c) => parseInt(c.avgQuizScore) > parseInt(best.avgQuizScore) ? c : best)
            : null;
        const weakest = scoredCourses.length > 0
            ? scoredCourses.reduce((worst, c) => parseInt(c.avgQuizScore) < parseInt(worst.avgQuizScore) ? c : worst)
            : null;

        // ================================================================
        // 3. BUILD THE ENRICHED AI PROMPT
        // ================================================================

        const model = careerGenAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
You are a Senior Career Coach and AI Career Advisor for the Edunova learning platform.

A student wants to become a: "${targetRole}"

STUDENT PROFILE DATA (from their actual learning records):
- Total courses enrolled: ${overallStats.totalCoursesEnrolled}
- Total quizzes completed: ${overallStats.totalQuizzesCompleted}
- Total XP earned: ${overallStats.totalXP}
${strongest ? `- STRONGEST subject: "${strongest.title}" (avg quiz score: ${strongest.avgQuizScore})` : ''}
${weakest && weakest !== strongest ? `- WEAKEST subject: "${weakest.title}" (avg quiz score: ${weakest.avgQuizScore})` : ''}

DETAILED COURSE PERFORMANCE:
${coursePerformance.length > 0
                ? coursePerformance.map(c =>
                    `• "${c.title}" — Completion: ${c.completionRate}, Quiz Avg: ${c.avgQuizScore}, Performance: ${c.performance}`
                ).join('\n')
                : '• No courses enrolled yet.'
            }

YOUR TASK:
Based on the student's actual performance data above, generate a personalized Career Roadmap. Consider their strengths, weaknesses, and gaps relative to the target role "${targetRole}".

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
    "score": 65,
    "summary": "A brief 1-2 sentence personalized assessment of the student's readiness.",
    "strengths": ["Specific strength 1 based on their data", "Strength 2"],
    "missingSkills": ["Specific missing skill 1", "Missing skill 2", "Missing skill 3"],
    "careerPaths": [
        {
            "title": "Career Path Title",
            "description": "Why this fits the student based on their strengths.",
            "matchScore": 85,
            "icon": "💻"
        },
        {
            "title": "Alternative Career Path",
            "description": "Another option based on their profile.",
            "matchScore": 72,
            "icon": "📊"
        },
        {
            "title": "Stretch Goal Career",
            "description": "Ambitious option if they close their skill gaps.",
            "matchScore": 55,
            "icon": "🚀"
        }
    ],
    "roadmap": [
        {
            "phase": "Phase 1: Foundation",
            "duration": "1-2 months",
            "tasks": ["Specific task 1", "Specific task 2"],
            "icon": "📚"
        },
        {
            "phase": "Phase 2: Skill Building",
            "duration": "2-3 months",
            "tasks": ["Specific task 1", "Specific task 2"],
            "icon": "🔨"
        },
        {
            "phase": "Phase 3: Portfolio & Practice",
            "duration": "1-2 months",
            "tasks": ["Specific task 1", "Specific task 2"],
            "icon": "💼"
        },
        {
            "phase": "Phase 4: Job Ready",
            "duration": "1 month",
            "tasks": ["Specific task 1", "Specific task 2"],
            "icon": "🎯"
        }
    ],
    "advice": "A concise, actionable paragraph of personalized advice."
}

RULES:
- "score" is an integer 0-100 representing career readiness (use lower scores if they lack relevant courses).
- "careerPaths" must have exactly 3 items, sorted by matchScore descending.
- "roadmap" must have exactly 4 phases, each with 2-3 specific tasks.
- If the student has relevant courses, reference their actual course names and performance to personalize the roadmap.
- CRITICAL: If the student has no courses enrolled, or no courses relevant to the target role, you MUST still return a valid JSON object providing a generalized roadmap to get them started in that career. Do not refuse to answer. Do not output raw text explaining that you lack data.

RESPOND WITH ONLY THE JSON OBJECT.
`;

        // ================================================================
        // 4. CALL GEMINI & PARSE RESPONSE
        // ================================================================

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI is taking too long. Please try again.")), 25000)
        );

        const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        const responseText = result.response.text();

        // Clean markdown fences
        const cleanedText = responseText
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/gi, "")
            .trim();

        let analysisData;
        try {
            analysisData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Career AI JSON parse failed. Raw:", cleanedText);
            return res.json({ success: false, message: "AI returned invalid response. Please try again." });
        }

        // Validate required fields exist
        if (!analysisData.score || !analysisData.careerPaths || !analysisData.roadmap) {
            return res.json({ success: false, message: "AI response missing required fields." });
        }

        res.json({ success: true, analysisData });

    } catch (error) {
        console.error("Career Analysis Error:", error);
        res.json({ success: false, message: error.message });
    }
};