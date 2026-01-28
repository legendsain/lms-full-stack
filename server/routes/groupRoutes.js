import express from 'express';
import { createGroups, getGroupBatches, getGroupsByBatch, getStudentGroups } from '../controllers/groupController.js';

const groupRouter = express.Router();

groupRouter.post('/create', createGroups);
groupRouter.get('/list/:quizId', getGroupBatches);
groupRouter.get('/batch/:batchId', getGroupsByBatch);

// NEW ROUTE
groupRouter.get('/my-groups/:courseId', getStudentGroups); 

export default groupRouter;