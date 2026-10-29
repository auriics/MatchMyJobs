import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.js';
import fs from 'fs';

// Ensure local upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

export const isS3Configured = Boolean(
  config.aws.accessKeyId &&
    !config.aws.accessKeyId.includes('your-aws') &&
    config.aws.secretAccessKey &&
    !config.aws.secretAccessKey.includes('your-aws') &&
    config.aws.s3BucketName
);

export const s3Client = isS3Configured
  ? new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
      ...(config.aws.endpoint ? { endpoint: config.aws.endpoint } : {}),
    })
  : null;
