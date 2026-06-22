import 'dotenv/config'; // Carga el .env
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import mongoose from 'mongoose'; 

import trackRoutes from './routes/trackRoutes';
import roomRoutes from './routes/roomRoutes';
import initAudioSocket from './sockets/audioSocket';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// RUTAS
app.use('/api/tracks', trackRoutes);
app.use('/api/rooms', roomRoutes);

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error("Error: MONGODB_URI no está definida en el .env");
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(() => console.log('🍃 Conectado exitosamente a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Inicializar Sockets
initAudioSocket(io);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});