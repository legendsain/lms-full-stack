import Message from '../models/Message.js';
import StudyGroup from '../models/StudyGroup.js';

// ====================================================================
// GET CHAT HISTORY — Paginated messages for a team
// ====================================================================
export const getChatHistory = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.auth.userId;

        // Verify user is a member of this team
        const team = await StudyGroup.findById(teamId);
        if (!team) {
            return res.json({ success: false, message: "Team not found." });
        }

        const isMember = team.members.some(m => m.userId === userId);
        if (!isMember) {
            return res.json({ success: false, message: "You are not a member of this team." });
        }

        // Fetch last 100 messages (most recent)
        const messages = await Message.find({ teamId })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();

        res.json({
            success: true,
            messages,
            team: {
                _id: team._id,
                groupName: team.groupName,
                batchTitle: team.batchTitle,
                members: team.members,
            }
        });

    } catch (error) {
        console.error("Chat History Error:", error);
        res.json({ success: false, message: error.message });
    }
};
