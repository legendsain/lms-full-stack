import express from 'express';
import { generateMindMap, saveMindMap, getCourseMindMaps } from '../controllers/mindmapController.js';
import { requireAuth } from '@clerk/express'; 

const mindmapRouter = express.Router();

// Educator Routes (Requires login)
mindmapRouter.post('/generate', requireAuth, generateMindMap);
mindmapRouter.post('/save', requireAuth, saveMindMap);

// Public/Student Routes
mindmapRouter.get('/course/:courseId', getCourseMindMaps);

export default mindmapRouter;