import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import connectCloudinary from './configs/cloudinary.js'
import userRouter from './routes/userRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import courseRouter from './routes/courseRoute.js'
import quizRouter from './routes/quizRoutes.js'
import groupRouter from './routes/groupRoutes.js'
import careerRouter from './routes/careerRoutes.js'
import analyticsRouter from './routes/analyticsRoutes.js';
import mindmapRouter from './routes/mindmapRoutes.js';
// Initialize Express
const app = express()

// Connect to database
await connectDB()
await connectCloudinary()

// --- 1. CORS CONFIGURATION (Fixes Network Error) ---
const allowedOrigins = [
  "http://localhost:5173",                          // Local Development
  "https://lms-full-stack-olive-five.vercel.app"    // Your Deployed Frontend
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}))

// --- 2. WEBHOOKS (Must be before global express.json) ---
// Stripe needs raw body, so we define it here first
app.post('/clerk', express.json(), clerkWebhooks)
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)

// --- 3. GLOBAL MIDDLEWARE (Fixes "targetRole undefined") ---
// This ensures req.body is parsed for ALL API routes below
app.use(express.json()) 
app.use(clerkMiddleware())

// --- 4. API ROUTES ---
app.get('/', (req, res) => res.send("API Working"))

// Note: Removed 'express.json()' from inside these calls because we added it globally above
app.use('/api/educator', educatorRouter)
app.use('/api/course', courseRouter)
app.use('/api/user', userRouter)
app.use('/api/quiz', quizRouter)
app.use('/api/group', groupRouter)
app.use('/api/career', careerRouter) // Now works because express.json() is above!
app.use('/api/analytics', analyticsRouter);
app.use('/api/mindmap', mindmapRouter);
// Port
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})