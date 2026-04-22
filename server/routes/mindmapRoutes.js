import express from 'express';
import { generateMindMap, saveMindMap, getCourseMindMaps } from '../controllers/mindmapController.js';
// Import your auth middleware if you have one to protect these routes
// import { requireAuth } from '../middlewares/authMiddleware.js'; 

const mindmapRouter = express.Router();

mindmapRouter.post('/generate', generateMindMap); 
mindmapRouter.post('/save', saveMindMap);
mindmapRouter.get('/course/:courseId', getCourseMindMaps);

export default mindmapRouter;