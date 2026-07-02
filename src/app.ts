import 'dotenv/config'; // Carga el .env
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import mongoose from 'mongoose'; 

import authRoutes from './routes/authRoutes';
import trackRoutes from './routes/trackRoutes';
import roomRoutes from './routes/roomRoutes';
import initAudioSocket from './sockets/audioSocket';

import './config/passport';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Middlewares Base
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: 'Secreto seguro de SonusRoom',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// RUTAS
app.use('/api/tracks', trackRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error("Error: MONGODB_URI no está definida en el .env");
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(() => console.log('Conectado exitosamente a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        credentials: true
    }
});

//Middlewares de sesión con Socket.io
io.use((socket, next) => {
    sessionMiddleware(socket.request as any, {} as any, next as any);
});

io.use((socket, next) => {
    passport.initialize()(socket.request as any, {} as any, next as any);
});

io.use((socket, next) => {
    passport.session()(socket.request as any, {} as any, next as any);
});

// Inicializar Sockets de Audio de forma segura
initAudioSocket(io);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});