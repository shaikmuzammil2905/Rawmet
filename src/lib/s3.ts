import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
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

export async function headDbInS3(): Promise<{ etag: string; lastModified?: Date } | null> {
  if (!isS3Configured()) return null;
  try {
    const client = getS3Client();
    const res = await client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: "database/rawmet.db",
      })
    );
    return { etag: res.ETag || "", lastModified: res.LastModified };
  } catch {
    return null;
  }
}

export async function uploadDbToS3(dbFilePath: string): Promise<{ ok: boolean; etag?: string }> {
  if (!isS3Configured()) return { ok: false };
  if (!fs.existsSync(dbFilePath)) {
    throw new Error(`Database file missing at ${dbFilePath}`);
  }
  const buffer = fs.readFileSync(dbFilePath);
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: "database/rawmet.db",
    Body: buffer,
    ContentType: "application/x-sqlite3",
  });
  const res = await client.send(command);
  return { ok: true, etag: res.ETag };
}

export async function downloadDbFromS3(targetPath: string): Promise<{ ok: boolean; etag?: string }> {
  if (!isS3Configured()) return { ok: false };
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: "database/rawmet.db",
    });
    const res = await client.send(command);
    if (!res.Body) return { ok: false };
    const byteArray = await res.Body.transformToByteArray();
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, Buffer.from(byteArray));
    return { ok: true, etag: res.ETag };
  } catch (err) {
    console.error("Failed to download database from S3:", err);
    return { ok: false };
  }
}
