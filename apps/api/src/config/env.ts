import dotenv from 'dotenv';
import path from 'path';

// Load .env from current dir or project root
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/antigravite?schema=public',

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || 'antigravite-super-secret-access-key-2026',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'antigravite-super-secret-refresh-key-2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshExpiresInDays: 7,
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.AWS_S3_BUCKET_NAME || 'antigravite-uploads',
    endpoint: process.env.AWS_ENDPOINT || undefined,
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri:
        process.env.LINKEDIN_REDIRECT_URI ||
        'http://localhost:5173/auth/linkedin/callback',
    },
  },

  clientUrls: (
    process.env.CLIENT_URL ||
    'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'
  )
    .split(',')
    .map((url) => url.trim()),

  uploadDir: path.resolve(process.cwd(), 'uploads'),
};
