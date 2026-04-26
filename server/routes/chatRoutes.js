import express from 'express';
import { getChatHistory } from '../controllers/chatController.js';

const chatRouter = express.Router();

// GET /api/chat/:teamId — Fetch message history for a team
chatRouter.get('/:teamId', getChatHistory);

export default chatRouter;
