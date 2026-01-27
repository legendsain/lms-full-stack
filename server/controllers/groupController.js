import QuizResult from "../models/QuizResult.js";
import StudyGroup from "../models/StudyGroup.js";
import User from "../models/User.js";

export const createGroups = async (req, res) => {
    try {
        const { courseId, quizId, groupSize } = req.body;

        // 1. Fetch all results for this quiz
        const results = await QuizResult.find({ quizId }).sort({ score: -1 }); // Sort DESC (Highest first)

        if (results.length === 0) {
            return res.json({ success: false, message: "No students have taken this quiz yet." });
        }

        // 2. Fetch User Details for the results
        const students = await Promise.all(results.map(async (r) => {
            const user = await User.findById(r.userId);
            return {
                userId: r.userId,
                studentName: user ? user.name : "Unknown",
                studentImage: user ? user.imageUrl : "",
                score: r.score
            };
        }));

        // 3. Remove existing groups for this quiz (Overwrite mode)
        await StudyGroup.deleteMany({ quizId });

        // 4. Algorithm: Balanced Snake Draft
        // Example: If 2 teams. Order: Team 1, Team 2, Team 2, Team 1, Team 1...
        // This pairs high scorers with low scorers naturally.
        
        const numberOfGroups = Math.ceil(students.length / groupSize);
        const groups = Array.from({ length: numberOfGroups }, (_, i) => ({
            groupName: `Team ${String.fromCharCode(65 + i)}`, // Team A, Team B...
            members: [],
            totalScore: 0
        }));

        students.forEach((student, index) => {
            // Snake Logic: 
            // Even rounds (0, 2, 4...) go 0 -> N
            // Odd rounds (1, 3, 5...) go N -> 0
            const round = Math.floor(index / numberOfGroups);
            const isEvenRound = round % 2 === 0;
            const groupIndex = isEvenRound 
                ? index % numberOfGroups 
                : (numberOfGroups - 1) - (index % numberOfGroups);

            groups[groupIndex].members.push(student);
            groups[groupIndex].totalScore += student.score;
        });

        // 5. Save to DB
        await Promise.all(groups.map(async (g) => {
            const newGroup = new StudyGroup({
                courseId,
                quizId,
                groupName: g.groupName,
                members: g.members,
                avgScore: (g.totalScore / g.members.length).toFixed(1)
            });
            await newGroup.save();
        }));

        res.json({ success: true, message: `Successfully created ${numberOfGroups} balanced teams.` });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getGroups = async (req, res) => {
    try {
        const { quizId } = req.params;
        const groups = await StudyGroup.find({ quizId });
        res.json({ success: true, groups });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};