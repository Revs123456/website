import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import * as helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Construct DATABASE_URL from individual DB env vars when not set directly
if (!process.env.DATABASE_URL) {
  const { DB_HOST, DB_PORT = '5432', DB_USER, DB_PASS, DB_NAME = 'postgres' } = process.env;
  if (DB_HOST && DB_USER && DB_PASS) {
    process.env.DATABASE_URL = `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASS)}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require&pgbouncer=true`;
  }
}

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS env var must be set in production');
  }

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use((helmet as any).default());

  // Cookie parser
  app.use(cookieParser());

  // Body size limit — prevents crash-via-huge-payload
  app.use(require('express').json({ limit: '1mb' }));
  app.use(require('express').urlencoded({ limit: '1mb', extended: true }));

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3002'];
  app.enableCors({ origin: allowedOrigins, credentials: true });

  // Input validation — strips unknown fields, validates types
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Generic error responses — no stack traces or internal details leaked
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('v1');
  await app.listen(process.env.PORT ?? 4001, '0.0.0.0');

  // Graceful shutdown — finish in-flight requests before closing
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });
}
bootstrap();
