import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  // rawBody is required to verify payment-webhook HMAC signatures (Bictorys).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Trust exactly one hop (Caddy, on the same Docker network — see
  // Caddyfile, which overwrites X-Forwarded-For with the verified remote
  // address so this can't be spoofed by a client-supplied header). Without
  // this, Express's req.ip is always Caddy's container IP for every request,
  // which collapses ThrottlerGuard's per-IP rate limit into one global bucket
  // shared by every real user.
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // Cookie parser — required for httpOnly JWT cookie extraction in JwtStrategy.
  app.use(cookieParser());

  // Global exception filter and interceptor
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global pipe for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation — never exposed in production.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PERMIS2.0 API')
      .setDescription('API for driving license exam preparation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`✨ Server running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
