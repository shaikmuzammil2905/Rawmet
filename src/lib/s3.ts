import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";

const region = process.env.AWS_REGION || "ap-southeast-2";
const bucketName = process.env.AWS_S3_BUCKET_NAME || "rawmat-mart-storage";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

export function isS3Configured(): boolean {
  return Boolean(bucketName && accessKeyId && secretAccessKey);
}

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
    });
  }
  return s3ClientInstance;
}

export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const client = getS3Client();
  const key = `uploads/${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await client.send(command);

  // Return public S3 URL
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadDbToS3(dbFilePath: string): Promise<boolean> {
  if (!isS3Configured()) return false;
  try {
    if (!fs.existsSync(dbFilePath)) return false;
    const buffer = fs.readFileSync(dbFilePath);
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: "database/rawmet.db",
      Body: buffer,
      ContentType: "application/x-sqlite3",
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.error("Failed to upload database to S3:", err);
    return false;
  }
}

export async function downloadDbFromS3(targetPath: string): Promise<boolean> {
  if (!isS3Configured()) return false;
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: "database/rawmet.db",
    });
    const res = await client.send(command);
    if (!res.Body) return false;
    const byteArray = await res.Body.transformToByteArray();
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, Buffer.from(byteArray));
    return true;
  } catch (err) {
    console.error("Failed to download database from S3:", err);
    return false;
  }
}
