import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    imageUrl: { type: String, required: true },
    enrolledCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    // --- NEW GAMIFICATION SCHEMA ---
        gamification: {
            points: { type: Number, default: 0 },        // XP (Leaderboard)
            tokens: { type: Number, default: 0 },        // Currency (Shop)
            quizzesCompleted: { type: Number, default: 0 },
            lastActivity: { type: Date, default: Date.now }
        },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User