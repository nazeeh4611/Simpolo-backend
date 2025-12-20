import AWS from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

const s3 = new AWS.S3()

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: (req, file, cb) =>
      cb(null, `${req.baseUrl.includes('gallery') ? 'gallery' : 'projects'}/${Date.now()}_${file.originalname}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
})

export const deleteFromS3 = key =>
  s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key }).promise()

export const deleteMultipleFromS3 = keys =>
  s3.deleteObjects({
    Bucket: process.env.AWS_S3_BUCKET,
    Delete: { Objects: keys.map(Key => ({ Key })) }
  }).promise()
