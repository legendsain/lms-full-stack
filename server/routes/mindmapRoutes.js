import express from 'express';
import { generateMindMap, saveMindMap, getCourseMindMaps, deleteMindMap } from '../controllers/mindmapController.js';

const mindmapRouter = express.Router();

mindmapRouter.post('/generate', generateMindMap); 
mindmapRouter.post('/save', saveMindMap);
mindmapRouter.get('/course/:courseId', getCourseMindMaps);
mindmapRouter.delete('/delete/:mapId', deleteMindMap);

export default mindmapRouter;