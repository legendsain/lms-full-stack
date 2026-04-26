import express from 'express';
import { getChatHistory, sendMessage } from '../controllers/chatController.js';

const chatRouter = express.Router();

// GET /api/chat/:teamId — Fetch message history for a team
chatRouter.get('/:teamId', getChatHistory);

// POST /api/chat/:teamId — Send a new message
chatRouter.post('/:teamId', sendMessage);

export default chatRouter;
