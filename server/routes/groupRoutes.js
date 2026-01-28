import express from 'express';
import { createGroups, getGroupBatches, getGroupsByBatch, getStudentGroups, deleteGroupBatch } from '../controllers/groupController.js';

const groupRouter = express.Router();

groupRouter.post('/create', createGroups);
groupRouter.get('/list/:quizId', getGroupBatches);
groupRouter.get('/batch/:batchId', getGroupsByBatch);
groupRouter.get('/my-groups/:courseId', getStudentGroups);
groupRouter.delete('/batch/:batchId', deleteGroupBatch);

export default groupRouter;