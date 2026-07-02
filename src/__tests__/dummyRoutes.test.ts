import request from 'supertest';
import { createApp } from '../createApp';

describe('Dummy endpoints', () => {
    const app = createApp();

    describe('GET /api/health', () => {
        it('returns 200 with service status', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                status: 'ok',
                service: 'sonusroom-backend',
            });
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('GET /api/dummy', () => {
        it('returns 200 with dummy payload', async () => {
            const response = await request(app).get('/api/dummy');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Dummy endpoint',
                data: {
                    foo: 'bar',
                    version: '1.0.0',
                },
            });
        });
    });
});
