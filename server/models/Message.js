import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup', required: true, index: true },
    senderId: { type: String, required: true },    // Clerk User ID
    senderName: { type: String, required: true },
    senderImage: { type: String, default: '' },
    text: { type: String, required: true, maxlength: 2000 },
}, { timestamps: true });

// Index for efficient message retrieval per team
messageSchema.index({ teamId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
