import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, isS3Configured } from '../config/s3.js';
import { config } from '../config/env.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export interface UploadResult {
  avatarUrl: string;
  key: string;
}

export class StorageService {
  /**
   * Generates a unique file key
   */
  private static generateKey(originalFilename: string, prefix = 'avatars'): string {
    const ext = path.extname(originalFilename) || '.jpg';
    const uniqueId = crypto.randomUUID();
    return `${prefix}/${uniqueId}${ext}`;
  }

  /**
   * Upload an avatar buffer to AWS S3, or to local disk fallback
   */
  static async uploadAvatar(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    baseUrl = `http://localhost:${config.port}`
  ): Promise<UploadResult> {
    const key = this.generateKey(filename, 'avatars');

    if (isS3Configured && s3Client) {
      const command = new PutObjectCommand({
        Bucket: config.aws.s3BucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      const avatarUrl = config.aws.endpoint
        ? `${config.aws.endpoint}/${config.aws.s3BucketName}/${key}`
        : `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

      return { avatarUrl, key };
    }

    // Local Disk Fallback for development/testing
    const localTargetDir = path.join(config.uploadDir, 'avatars');
    await fs.mkdir(localTargetDir, { recursive: true });

    const localFilePath = path.join(config.uploadDir, key);
    await fs.writeFile(localFilePath, fileBuffer);

    const avatarUrl = `${baseUrl}/uploads/${key}`;
    return { avatarUrl, key };
  }

  /**
   * Generates a pre-signed PUT URL for direct client-to-S3 uploads
   */
  static async getPresignedUploadUrl(
    filename: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const key = this.generateKey(filename, 'avatars');

    if (isS3Configured && s3Client) {
      const command = new PutObjectCommand({
        Bucket: config.aws.s3BucketName,
        Key: key,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
      const fileUrl = `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

      return { uploadUrl, fileUrl, key };
    }

    // In local dev without AWS S3 configured, client uses standard POST /profile/avatar multipart endpoint
    const fileUrl = `http://localhost:${config.port}/uploads/${key}`;
    return {
      uploadUrl: `http://localhost:${config.port}/api/profile/avatar`,
      fileUrl,
      key,
    };
  }
}
