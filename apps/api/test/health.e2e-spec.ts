import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

// Provide sane defaults so the ConfigModule validation passes when the
// variables are not exported (local runs against docker-compose defaults).
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://permis2.0:password123@localhost:5432/permis2.0';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-16+';

import { AppModule } from '../src/app.module';

describe('API smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: expect.any(String) });
  });

  it('GET /auth/me without a token is rejected', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
