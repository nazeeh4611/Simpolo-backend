import mongoose from 'mongoose'

import dotenv from 'dotenv'

dotenv.config()


const databaseConnection = async()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("database is connected")

  } catch (error) {
    console.error("databse connection error",error)
    throw error
  }
}

export default databaseConnection