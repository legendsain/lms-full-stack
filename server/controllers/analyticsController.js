import User from '../models/User.js';
import QuizResult from '../models/QuizResult.js';
import Course from '../models/Course.js';

// Helper: Calculate Risk Score (Hardened against missing data)
const calculateRisk = (student, quizResults, totalCourseQuizzes) => {
    
    // 1. Recency Risk (40%)
    // FIX: Use Optional Chaining (?.) so it doesn't crash if gamification is missing.
    // Fallback to createdAt, and if that's missing, fallback to today.
    const activityDate = student?.gamification?.lastActivity || student?.createdAt || new Date();
    const lastLogin = new Date(activityDate);
    const today = new Date();
    
    const daysInactive = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
    
    // Cap inactive risk at 100 (if inactive > 30 days, max risk)
    let recencyRisk = Math.min((daysInactive / 30) * 100, 100);

    // 2. Performance Risk (30%)
    let avgScore = 0;
    if (quizResults && quizResults.length > 0) {
        const totalScore = quizResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
        avgScore = totalScore / quizResults.length;
    }
    const performanceRisk = 100 - avgScore;

    // 3. Engagement Risk (30%)
    const totalQuizzes = totalCourseQuizzes || 1; 
    const completionRate = Math.min(((quizResults?.length || 0) / totalQuizzes) * 100, 100);
    const engagementRisk = 100 - completionRate;

    // Weighted Formula
    const totalRisk = (recencyRisk * 0.4) + (performanceRisk * 0.3) + (engagementRisk * 0.3);
    
    return {
        score: Math.round(totalRisk),
        factors: {
            daysInactive: daysInactive < 0 ? 0 : daysInactive, // Prevent negative days
            avgScore: Math.round(avgScore),
            completionRate: Math.round(completionRate)
        }
    };
};

// API: Get At-Risk Students
export const getAtRiskStudents = async (req, res) => {
    try {
        const educatorId = req.auth.userId;

        // 1. Fetch all courses created by this educator
        const courses = await Course.find({ educatorId });
        
        if (!courses || courses.length === 0) {
             return res.json({ success: true, atRiskData: [] });
        }

        // Map ObjectIds to Strings for robust comparison
        const courseIds = courses.map(c => c._id.toString());

        // 2. Fetch all students enrolled in these courses
        // FIX: Removed strict `role: 'student'` check. If they are enrolled, track them.
        const students = await User.find({ 
            enrolledCourses: { $in: courseIds }
        });

        const atRiskData = [];

        // 3. Analyze each student
        for (const student of students) {
            
            const results = await QuizResult.find({ 
                userId: student._id.toString(),
                courseId: { $in: courseIds }
            });

            // Calculate total quizzes roughly based on enrolled courses
            const studentCourses = courses.filter(c => 
                student.enrolledCourses.map(id => id.toString()).includes(c._id.toString())
            );
            
            // Assuming 5 quizzes per course for baseline metric
            let totalQuizzesAvailable = studentCourses.length * 5; 
            
            // Prevent dividing by zero
            if (totalQuizzesAvailable === 0) totalQuizzesAvailable = 1;

            const riskAnalysis = calculateRisk(student, results, totalQuizzesAvailable);

            // Filter: Return students with Risk > 50%
            if (riskAnalysis.score > 50) {
                atRiskData.push({
                    studentId: student._id,
                    name: student.name || "Unknown Student",
                    email: student.email || "No Email",
                    imageUrl: student.imageUrl || "https://via.placeholder.com/150",
                    riskScore: riskAnalysis.score,
                    factors: riskAnalysis.factors
                });
            }
        }

        // Sort by highest risk first
        atRiskData.sort((a, b) => b.riskScore - a.riskScore);

        res.json({ success: true, atRiskData });

    } catch (error) {
        console.error("Analytics Error:", error); // Logs to Vercel/Terminal so we can see what breaks
        res.json({ success: false, message: error.message });
    }
};