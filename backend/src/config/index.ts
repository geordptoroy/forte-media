import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  useMock: process.env.USE_MOCK === 'true',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwt',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'forte_media',
  },
  meta: {
    apiKey: process.env.META_API_KEY || '',
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
  },
};
