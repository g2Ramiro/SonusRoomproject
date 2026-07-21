import request from 'supertest';

jest.mock('../config/passport', () => ({
    isGoogleOAuthConfigured: false,
}));

import { createApp } from '../createApp';

describe('Aplicación HTTP', () => {
    const app = createApp();

    it('expone el endpoint público de salud', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            status: 'ok',
            service: 'sonusroom-backend',
        });
        expect(response.body.timestamp).toEqual(expect.any(String));
    });

    it('redirige a login cuando se visita la raíz sin sesión', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    it('informa que no hay usuario actual cuando no existe una sesión', async () => {
        const response = await request(app).get('/api/auth/current-user');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            logueado: false,
            mensaje: 'No hay ninguna sesión activa',
        });
    });

    it('responde 503 en OAuth cuando faltan sus credenciales', async () => {
        const response = await request(app).get('/api/auth/google');

        expect(response.status).toBe(503);
        expect(response.body).toEqual({
            error: 'Google OAuth no está configurado',
            mensaje: 'Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el archivo .env.',
        });
    });

    it.each(['/api/tracks', '/api/rooms', '/api/messages', '/api/playlists'])(
        'protege %s cuando no existe una sesión',
        async (endpoint) => {
            const response = await request(app).get(endpoint);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: 'No autorizado',
                mensaje: 'Debes iniciar sesión para realizar esta acción.',
            });
        }
    );

    it('expone la especificación OpenAPI como JSON', async () => {
        const response = await request(app).get('/api-docs.json');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            openapi: '3.0.3',
            info: {
                title: expect.any(String),
            },
        });
    });
});
