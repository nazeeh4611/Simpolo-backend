import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)

app.use('/api/admin', adminRoutes)
app.use('/api', userRoutes)


app.listen(5000)
