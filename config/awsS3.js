import AWS from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import dotenv from 'dotenv'

dotenv.config()

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

const s3 = new AWS.S3()

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: (req, file, cb) => {
      const folder = req.baseUrl.includes('gallery') ? 'gallery' : 'projects'
      cb(null, `${folder}/${Date.now()}_${file.originalname}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

export const deleteFromS3 = (key) =>
  s3.deleteObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  }).promise()

export const deleteMultipleFromS3 = (keys) =>
  s3.deleteObjects({
    Bucket: process.env.AWS_S3_BUCKET,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
    },
  }).promise()
