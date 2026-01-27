import express from 'express';
import { createGroups, getGroups } from '../controllers/groupController.js';

const groupRouter = express.Router();

groupRouter.post('/create', createGroups);
groupRouter.get('/:quizId', getGroups);

export default groupRouter;