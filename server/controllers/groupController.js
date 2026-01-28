import QuizResult from "../models/QuizResult.js";
import StudyGroup from "../models/StudyGroup.js";
import User from "../models/User.js";

// 1. Create Groups (Updated)
export const createGroups = async (req, res) => {
    try {
        const { courseId, quizId, numberOfGroups, batchTitle } = req.body; // Changed input

        // A. Fetch Results (Sort by Date ASC to get First Attempt)
        const allResults = await QuizResult.find({ quizId }).sort({ date: 1 });

        if (allResults.length === 0) {
            return res.json({ success: false, message: "No students have taken this quiz yet." });
        }

        // B. FIX: Deduplicate - Keep only FIRST attempt per student
        const uniqueStudentsMap = new Map();
        
        for (const result of allResults) {
            if (!uniqueStudentsMap.has(result.userId)) {
                // Fetch user details for this result
                const user = await User.findById(result.userId);
                uniqueStudentsMap.set(result.userId, {
                    userId: result.userId,
                    studentName: user ? user.name : "Unknown",
                    studentImage: user ? user.imageUrl : "",
                    score: result.score
                });
            }
        }

        const students = Array.from(uniqueStudentsMap.values());
        
        // Sort students by score DESC for the balancing algorithm
        students.sort((a, b) => b.score - a.score);

        if (students.length < numberOfGroups) {
            return res.json({ success: false, message: `Not enough students (${students.length}) to make ${numberOfGroups} teams.` });
        }

        // C. Generate a Batch ID (Timestamp based)
        const batchId = Date.now().toString();
        const finalBatchTitle = batchTitle || `Groups Generated on ${new Date().toLocaleDateString()}`;

        // D. Algorithm: Balanced Snake Draft with Fixed Team Count
        const groups = Array.from({ length: numberOfGroups }, (_, i) => ({
            groupName: `Team ${String.fromCharCode(65 + i)}`, 
            members: [],
            totalScore: 0
        }));

        students.forEach((student, index) => {
            const round = Math.floor(index / numberOfGroups);
            const isEvenRound = round % 2 === 0;
            
            // Snake Logic: 0->N then N->0
            const groupIndex = isEvenRound 
                ? index % numberOfGroups 
                : (numberOfGroups - 1) - (index % numberOfGroups);

            groups[groupIndex].members.push(student);
            groups[groupIndex].totalScore += student.score;
        });

        // E. Save New Records (Don't delete old ones!)
        await Promise.all(groups.map(async (g) => {
            const newGroup = new StudyGroup({
                courseId,
                quizId,
                groupName: g.groupName,
                members: g.members,
                avgScore: g.members.length > 0 ? (g.totalScore / g.members.length).toFixed(1) : 0,
                batchId,
                batchTitle: finalBatchTitle
            });
            await newGroup.save();
        }));

        res.json({ success: true, message: `Successfully saved "${finalBatchTitle}" with ${numberOfGroups} teams.` });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Get List of Saved Batches (NEW)
export const getGroupBatches = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Aggregate to find unique batches
        const batches = await StudyGroup.aggregate([
            { $match: { quizId:  { $ne: null } } }, // Safety check (can filter by quizId objectId if casted)
            // Ideally we filter by quizId string matching or ObjectId matching. 
            // For simplicity in MERN often we do a find and manual filter or precise match if IDs align.
            // Let's use a simpler JS approach if aggregation is complex with ObjectIds:
        ]); 
        
        // Using distinct logic via Find for simplicity/safety with mixed types
        const allGroups = await StudyGroup.find({ quizId }).sort({ createdAt: -1 });
        
        const uniqueBatches = [];
        const seenBatches = new Set();

        allGroups.forEach(g => {
            if(!seenBatches.has(g.batchId)){
                seenBatches.add(g.batchId);
                uniqueBatches.push({
                    batchId: g.batchId,
                    batchTitle: g.batchTitle,
                    createdAt: g.createdAt,
                    teamCount: allGroups.filter(x => x.batchId === g.batchId).length
                });
            }
        });

        res.json({ success: true, batches: uniqueBatches });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Get Specific Group Set (Updated)
export const getGroupsByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const groups = await StudyGroup.find({ batchId });
        res.json({ success: true, groups });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
export const getStudentGroups = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.auth.userId; // From Clerk Auth

        // Find all groups in this course where 'members.userId' matches the logged-in student
        const groups = await StudyGroup.find({ 
            courseId, 
            "members.userId": userId 
        }).sort({ createdAt: -1 });

        res.json({ success: true, groups });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};