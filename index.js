import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import adminRoutes from './routes/AdminRoute.js'
import userRoutes from './routes/UserRoute.js'
import databaseConnection from './config/Db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5004

/* ================= CORS CONFIG ================= */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://simpolo.vercel.app' // add prod domain
]

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

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
