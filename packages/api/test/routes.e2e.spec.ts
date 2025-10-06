import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Routes smoke tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health should return 200', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('ok', true);
        expect(res.body).toHaveProperty('time');
      });
  });

  it('/levels should return 200 and array', () => {
    return request(app.getHttpServer())
      .get('/levels')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/levels/:id should return 404 for non-existent level', () => {
    return request(app.getHttpServer()).get('/levels/not-exist').expect(404);
  });

  it('/levels/search should return empty array for empty query', () => {
    return request(app.getHttpServer())
      .get('/levels/search?q=')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
      });
  });

  it('/levels/type/pixel should return array', () => {
    return request(app.getHttpServer())
      .get('/levels/type/pixel')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
