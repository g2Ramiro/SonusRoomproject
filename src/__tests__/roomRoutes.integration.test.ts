import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Request, Response, NextFunction } from 'express';

jest.mock('../middlewares/authMiddleware', () => ({
    isAuthorized: (req: Request, _res: Response, next: NextFunction) => {
        req.isAuthenticated = (() => true) as any;
        req.user = { _id: new mongoose.Types.ObjectId() };
        next();
    },
}));

jest.mock('../config/cloudinary', () => ({
    single: () => (req: Request, _res: Response, next: NextFunction) => {
        req.file = {
            path: 'https://res.cloudinary.com/demo/video/upload/sample.mp3',
        } as any;
        next();
    },
}));

import { createApp } from '../createApp';
import Room from '../models/Room';
import User from '../models/User';
import Track from '../models/Track';

describe('Rutas de Salas (roomRoutes Integration)', () => {
    let mongoServer: MongoMemoryServer;
    const app = createApp();

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await Room.deleteMany({});
        await User.deleteMany({});
        await Track.deleteMany({});
    });

    it('GET /api/rooms - Debe listar todas las salas', async () => {
        const response = await request(app).get('/api/rooms');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    it('POST /api/rooms - Debe crear una sala correctamente', async () => {
        const response = await request(app)
            .post('/api/rooms')
            .send({ nombreSala: 'Sala de prueba' });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('codigoAcceso');
        expect(response.body.sala.nombreSala).toBe('Sala de prueba');

        const roomEnBD = await Room.findOne({ codigoAcceso: response.body.codigoAcceso });
        expect(roomEnBD).not.toBeNull();
    });

    it('POST /api/rooms - Debe fallar si no se envía el nombre de la sala', async () => {
        const response = await request(app)
            .post('/api/rooms')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('PUT /api/rooms/:codigo - Debe actualizar el estado de la sala', async () => {
        const user = await User.create({ nombre: 'Host Test', email: 'host@test.com' });
        const room = await Room.create({
            nombreSala: 'Sala Estado',
            codigoAcceso: 'ROOM-1234',
            host: user._id,
        });

        const response = await request(app)
            .put(`/api/rooms/${room.codigoAcceso}`)
            .send({ estaReproduciendo: true });

        expect(response.status).toBe(200);
        expect(response.body.sala.estaReproduciendo).toBe(true);
    });

    it('DELETE /api/rooms/:codigo - Debe eliminar la sala existente', async () => {
        const user = await User.create({ nombre: 'Host Test', email: 'host2@test.com' });
        const room = await Room.create({
            nombreSala: 'Sala Borrar',
            codigoAcceso: 'ROOM-9999',
            host: user._id,
        });

        const response = await request(app).delete(`/api/rooms/${room.codigoAcceso}`);

        expect(response.status).toBe(200);
        const roomEnBD = await Room.findOne({ codigoAcceso: 'ROOM-9999' });
        expect(roomEnBD).toBeNull();
    });

    it('POST /api/rooms/:codigo/upload - Debe agregar una canción subida a la cola', async () => {
        const user = await User.create({ nombre: 'Host Test', email: 'host3@test.com' });
        const room = await Room.create({
            nombreSala: 'Sala Cola Upload',
            codigoAcceso: 'ROOM-5555',
            host: user._id,
        });

        const response = await request(app)
            .post(`/api/rooms/${room.codigoAcceso}/upload`)
            .send({ nombreCancion: 'Mi Cancion', artista: 'Mi Artista' });

        expect(response.status).toBe(201);
        expect(response.body.track.titulo).toBe('Mi Cancion');
        expect(response.body.colaActual.length).toBe(1);
    });

    it('POST /api/rooms/:codigo/queue - Debe agregar un track existente a la cola', async () => {
        const user = await User.create({ nombre: 'Host Test', email: 'host4@test.com' });
        const track = await Track.create({
            titulo: 'Track Existente',
            artista: 'Artista X',
            urlAudio: 'https://audio.mp3',
            subidoPor: user._id,
        });
        const room = await Room.create({
            nombreSala: 'Sala Cola Existente',
            codigoAcceso: 'ROOM-7777',
            host: user._id,
        });

        const response = await request(app)
            .post(`/api/rooms/${room.codigoAcceso}/queue`)
            .send({ trackId: track._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.colaActual.length).toBe(1);
    });
});