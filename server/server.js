import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import Routes
import userRouter from './routes/userRoutes.js';
import educatorRouter from './routes/educatorRoutes.js';
import courseRouter from './routes/courseRoutes.js';
import quizRouter from './routes/quizRoutes.js';
import groupRouter from './routes/groupRoutes.js';
import careerRouter from './routes/careerRoutes.js'; // Your new route

const app = express();

// --- CRITICAL MIDDLEWARE SECTION ---
// These MUST be at the top, before any routes!
app.use(express.json());  // <--- THIS LINE IS MISSING OR TOO LOW
app.use(cors());

// --- ROUTES SECTION ---
app.get('/', (req, res) => res.send("API is working"));
app.use('/api/user', userRouter);
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/group', groupRouter);
app.use('/api/career', careerRouter); // New route here

// ... server listen code ...
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});