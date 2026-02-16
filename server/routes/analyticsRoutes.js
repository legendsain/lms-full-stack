import express from 'express';
import { getAtRiskStudents } from '../controllers/analyticsController.js';
import { protectEducator } from '../middlewares/authMiddleware.js';

const analyticsRouter = express.Router();

// Protected route for educators
analyticsRouter.get('/at-risk', protectEducator, getAtRiskStudents)

export default analyticsRouter;