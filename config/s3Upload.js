import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";

dotenv.config()


if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY
) {
  throw new Error("❌ AWS credentials missing at runtime");
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
  },
});

export const uploadToS3 = async (file, folder) => {
    const safeFileName = file.originalname
      .trim()
      .replace(/\s+/g, "_")        // spaces → _
      .replace(/[^\w.-]/g, "");    // remove special chars
  
    const key = `${folder}/${Date.now()}-${safeFileName}`;
  
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });
  
    await upload.done();
  
    return {
      key,
      url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  };
  
