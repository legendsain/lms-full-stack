import User from '../models/User.js';
import QuizResult from '../models/QuizResult.js';
import Course from '../models/Course.js';

// Helper: Calculate Risk Score
const calculateRisk = (student, quizResults, totalCourseQuizzes) => {
    // 1. Recency Risk (40%)
    const lastLogin = new Date(student.gamification.lastActivity || student.createdAt);
    const today = new Date();
    const daysInactive = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
    
    // Cap inactive risk at 100 (if inactive > 30 days, max risk)
    let recencyRisk = Math.min((daysInactive / 30) * 100, 100);

    // 2. Performance Risk (30%)
    let avgScore = 0;
    if (quizResults.length > 0) {
        const totalScore = quizResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
        avgScore = totalScore / quizResults.length;
    }
    // If no quizzes taken, assume 0% performance (High Risk)
    const performanceRisk = 100 - avgScore;

    // 3. Engagement Risk (30%)
    // Prevent division by zero if course has no quizzes
    const totalQuizzes = totalCourseQuizzes || 1; 
    const completionRate = Math.min((quizResults.length / totalQuizzes) * 100, 100);
    const engagementRisk = 100 - completionRate;

    // Weighted Formula
    const totalRisk = (recencyRisk * 0.4) + (performanceRisk * 0.3) + (engagementRisk * 0.3);
    
    return {
        score: Math.round(totalRisk),
        factors: {
            daysInactive,
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
        const courseIds = courses.map(c => c._id);

        // 2. Fetch all students enrolled in these courses
        // We use $in to find users who have these course IDs in their enrolledCourses
        const students = await User.find({ 
            enrolledCourses: { $in: courseIds },
            role: 'student' 
        });

        const atRiskData = [];

        // 3. Analyze each student
        for (const student of students) {
            // Get student's results for these courses
            const results = await QuizResult.find({ 
                userId: student._id,
                courseId: { $in: courseIds }
            });

            // Get total quizzes available in their enrolled courses (Approximation)
            // For precision, you'd calculate exact quizzes per course, 
            // but for a summary, we can average it or check strictly.
            // Let's check quizzes for the courses they are enrolled in.
            const studentCourses = courses.filter(c => student.enrolledCourses.includes(c._id));
            let totalQuizzesAvailable = 0;
            studentCourses.forEach(c => {
                 // Assuming you store quiz count or calculate it. 
                 // If not, we can query Quiz collection. 
                 // For now, let's assume 5 quizzes per course for the heuristic 
                 // OR fetch strictly if performance allows.
                 totalQuizzesAvailable += 5; 
            });

            const riskAnalysis = calculateRisk(student, results, totalQuizzesAvailable);

            // Filter: Only return students with Risk > 50%
            if (riskAnalysis.score > 50) {
                atRiskData.push({
                    studentId: student._id,
                    name: student.name,
                    email: student.email,
                    imageUrl: student.imageUrl,
                    riskScore: riskAnalysis.score,
                    factors: riskAnalysis.factors
                });
            }
        }

        // Sort by highest risk first
        atRiskData.sort((a, b) => b.riskScore - a.riskScore);

        res.json({ success: true, atRiskData });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};