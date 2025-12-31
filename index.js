import dotenv from "dotenv";
dotenv.config();
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import adminRoutes from './routes/AdminRoute.js'
import userRoutes from './routes/UserRoute.js'
import databaseConnection from './config/Db.js'


const app = express()
const PORT = process.env.PORT || 5004

/* ================= CORS CONFIG ================= */
const allowedOrigins = [
  'https://simpolo-sigma.vercel.app',
  'http://localhost:5173',
  'https://simpolotrading.com',
  'http://simpolotrading.com' 
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'https://simpolo-sigma.vercel.app',
        'https://simpolotrading.com',
        'http://localhost:5173'
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // IMPORTANT: allow false instead of throwing error
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


/* ================= MIDDLEWARE ================= */
app.use(express.json())

/* ================= DATABASE ================= */
databaseConnection()

/* ================= ROUTES ================= */
app.use('/api/admin', adminRoutes)
app.use('/api', userRoutes)

/* ================= HEALTH CHECK ================= */
app.get('/', (req, res) => {
  res.json({ message: 'API is running 🚀' })
})

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
