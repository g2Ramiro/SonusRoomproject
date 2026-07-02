import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import { createApp } from './createApp';
import initAudioSocket from './sockets/audioSocket';

const app = createApp();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error('Error: MONGODB_URI no está definida en el .env');
    process.exit(1);
}

mongoose
    .connect(mongoUri)
    .then(() => console.log('🍃 Conectado exitosamente a MongoDB'))
    .catch((err) => console.error('Error al conectar a MongoDB:', err));

initAudioSocket(io);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export { app, createApp };
