import User from '../models/User.js';
import QuizResult from '../models/QuizResult.js';
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import nodemailer from 'nodemailer';

// ====================================================================
// RISK CALCULATION ENGINE
// ====================================================================
// A student is "At Risk" if ANY of these conditions are true:
//   1. lastLoginDate is null AND daysSincePurchase > 3 (never came back)
//   2. daysSinceLastLogin > 7 (ghost student)
//   3. averageQuizScore < 50% (struggling academically)
// ====================================================================

const calculateRiskScore = (student, quizResults, purchaseDate) => {
    const now = new Date();
    const factors = {};
    let riskReasons = [];

    // ---- Factor 1: Login Recency ----
    const lastLogin = student.lastLoginDate
        ? new Date(student.lastLoginDate)
        : null;

    const purchaseDt = purchaseDate ? new Date(purchaseDate) : new Date(student.createdAt);
    const daysSincePurchase = Math.floor((now - purchaseDt) / (1000 * 60 * 60 * 24));

    let daysInactive = 0;
    let loginRisk = 0;

    if (!lastLogin) {
        // NEVER LOGGED IN after purchasing
        daysInactive = daysSincePurchase;
        if (daysSincePurchase > 3) {
            loginRisk = 95; // Very high risk
            riskReasons.push("Never logged in since purchase");
        } else {
            loginRisk = 30; // Still new, not yet alarming
        }
    } else {
        daysInactive = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
        if (daysInactive > 30) {
            loginRisk = 100;
            riskReasons.push("Inactive for 30+ days");
        } else if (daysInactive > 14) {
            loginRisk = 80;
            riskReasons.push("Inactive for 14+ days");
        } else if (daysInactive > 7) {
            loginRisk = 60;
            riskReasons.push("Inactive for 7+ days");
        } else {
            loginRisk = Math.min((daysInactive / 7) * 40, 40);
        }
    }
    factors.daysInactive = Math.max(0, daysInactive);

    // ---- Factor 2: Quiz Performance ----
    let avgScore = 0;
    let performanceRisk = 50; // Default if no quizzes taken

    if (quizResults && quizResults.length > 0) {
        const totalPercent = quizResults.reduce(
            (sum, qr) => sum + (qr.score / qr.totalQuestions) * 100, 0
        );
        avgScore = Math.round(totalPercent / quizResults.length);
        performanceRisk = 100 - avgScore;

        if (avgScore < 50) {
            riskReasons.push(`Low quiz average: ${avgScore}%`);
        }
    } else {
        riskReasons.push("No quizzes attempted");
    }
    factors.avgScore = avgScore;

    // ---- Factor 3: Engagement (quiz completion rate) ----
    const quizzesAttempted = quizResults?.length || 0;
    const expectedQuizzes = Math.max(1, 3); // Base expectation
    const completionRate = Math.min((quizzesAttempted / expectedQuizzes) * 100, 100);
    const engagementRisk = 100 - completionRate;
    factors.completionRate = Math.round(completionRate);

    // ---- Weighted Risk Score ----
    const totalRisk = Math.round(
        (loginRisk * 0.45) +       // Login recency is the strongest signal
        (performanceRisk * 0.30) +  // Academic struggle
        (engagementRisk * 0.25)     // Engagement
    );

    // Determine risk level label
    let riskLevel = "low";
    if (totalRisk >= 80) riskLevel = "critical";
    else if (totalRisk >= 60) riskLevel = "high";
    else if (totalRisk >= 40) riskLevel = "medium";

    return {
        score: Math.min(totalRisk, 100),
        factors,
        riskLevel,
        riskReasons,
    };
};

// ====================================================================
// API: GET AT-RISK STUDENTS
// ====================================================================
export const getAtRiskStudents = async (req, res) => {
    try {
        const educatorId = req.auth.userId;

        // 1. Fetch all courses by this educator
        // FIX: Course model uses `educator` field, NOT `educatorId`
        const courses = await Course.find({ educator: educatorId });

        if (!courses || courses.length === 0) {
            return res.json({ success: true, atRiskData: [] });
        }

        const courseIds = courses.map(c => c._id.toString());

        // 2. Fetch all students enrolled in educator's courses
        const students = await User.find({
            enrolledCourses: { $in: courseIds }
        });

        // 3. Fetch earliest purchase dates for each student (for "never logged in" detection)
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const atRiskData = [];

        // 4. Analyze each student
        for (const student of students) {
            // Get quiz results for this student in educator's courses
            const results = await QuizResult.find({
                userId: student._id.toString(),
                courseId: { $in: courseIds }
            });

            // Find earliest purchase date for this student
            const studentPurchases = purchases.filter(
                p => p.userId === student._id.toString()
            );
            const earliestPurchase = studentPurchases.length > 0
                ? studentPurchases.reduce((earliest, p) =>
                    new Date(p.createdAt) < new Date(earliest.createdAt) ? p : earliest
                ).createdAt
                : student.createdAt;

            const riskAnalysis = calculateRiskScore(student, results, earliestPurchase);

            // Flag students with risk > 40% (catches more edge cases than 50%)
            if (riskAnalysis.score > 40) {
                atRiskData.push({
                    studentId: student._id,
                    name: student.name || "Unknown Student",
                    email: student.email || "No Email",
                    imageUrl: student.imageUrl || "https://via.placeholder.com/150",
                    riskScore: riskAnalysis.score,
                    riskLevel: riskAnalysis.riskLevel,
                    riskReasons: riskAnalysis.riskReasons,
                    factors: riskAnalysis.factors,
                    lastLoginDate: student.lastLoginDate,
                    memberSince: student.createdAt,
                });
            }
        }

        // Sort by highest risk first
        atRiskData.sort((a, b) => b.riskScore - a.riskScore);

        res.json({ success: true, atRiskData });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// ====================================================================
// API: NOTIFY STUDENT (EMAIL)
// ====================================================================
export const notifyStudent = async (req, res) => {
    try {
        const { studentId, email, name, riskReasons } = req.body;

        if (!email || !name) {
            return res.json({ success: false, message: "Missing student email or name." });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const htmlContent = `
            <h2>Notice: At-Risk Status Alert</h2>
            <p>Hi ${name},</p>
            <p>Your instructor has flagged your progress as "At Risk" based on the following reasons:</p>
            <ul>
                ${riskReasons.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
            <p>Please log in to your account and catch up on your coursework as soon as possible. Your success is important to us!</p>
            <br/>
            <p>Best regards,</p>
            <p>Edunova Learning Platform</p>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Important: Action Required for Your Coursework',
            html: htmlContent
        });

        res.json({ success: true, message: "Email sent successfully" });

    } catch (error) {
        console.error("Notify Student Error:", error);
        res.json({ success: false, message: "Failed to send email. Ensure EMAIL_USER and EMAIL_PASS are configured." });
    }
};