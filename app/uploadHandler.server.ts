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

const BUCKET_NAME =
  process.env.NODE_ENV === 'production' ? 'fiszki' : 'fiszki-dev'

export const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com`

export const uploadToS3 = async (
  data: AsyncIterable<Uint8Array>,
  contentType: string
) => {
  const key = nanoid()

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: await convertToBuffer(data),
      ContentType: contentType,
    })
  )
  return `${s3Url}/${key}`
}

export const deleteFromS3 = async (key: string) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  )
}

async function convertToBuffer(a: AsyncIterable<Uint8Array>) {
  const result = []
  for await (const chunk of a) {
    result.push(chunk)
  }
  return Buffer.concat(result)
}
