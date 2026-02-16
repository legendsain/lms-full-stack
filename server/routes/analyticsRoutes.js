import express from 'express';
import { getAtRiskStudents } from '../controllers/analyticsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const analyticsRouter = express.Router();

// Protected route for educators
analyticsRouter.get('/at-risk', requireAuth, getAtRiskStudents);

export default analyticsRouter;