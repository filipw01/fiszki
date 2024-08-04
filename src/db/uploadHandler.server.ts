import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

const region = 'eu-central-1'

const s3Client = new S3Client({
  region,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  },
})

const BUCKET_NAME = import.meta.env.PROD ? 'fiszki' : 'fiszki-dev'

export const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com`

export const uploadImageToS3 = async (file: File | null) => {
  if (!file || file.size === 0 || !file.type.startsWith('image/')) return null

  const key = nanoid()
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      // @ts-ignore - This SDK is weird and node centric, we use ArrayBuffer API instead of Buffer
      Body: await file.arrayBuffer(),
      ContentLength: file.size,
      ContentType: file.type,
    }),
  )
  return `${s3Url}/${key}`
}

export const deleteFromS3 = async (key: string) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  )
}
