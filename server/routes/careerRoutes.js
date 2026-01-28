import express from 'express';
import { analyzeCareerGap } from '../controllers/careerController.js';

const careerRouter = express.Router();

// Endpoint: /api/career/analyze
careerRouter.post('/analyze', analyzeCareerGap);

export default careerRouter;