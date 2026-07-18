import 'dotenv/config'; // Carga el .env
import passport from 'passport';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { createApp, sessionMiddleware } from './createApp';
import initAudioSocket from './sockets/audioSocket';

const app = createApp();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error('Error: MONGODB_URI no está definida en el .env');
    process.exit(1);
}

const startServer = async (): Promise<void> => {
    try {
        await mongoose.connect(mongoUri);
        console.log('🍃 Conectado exitosamente a MongoDB');

        const io = new Server(server, {
            cors: {
                origin: "http://localhost:3000", 
                credentials: true
            }
        });

        // Middlewares de sesión con Socket.io
        io.use((socket, next) => {
            sessionMiddleware(socket.request as any, {} as any, next as any);
        });

        io.use((socket, next) => {
            passport.initialize()(socket.request as any, {} as any, next as any);
        });

        io.use((socket, next) => {
            passport.session()(socket.request as any, {} as any, next as any);
        });

        io.use((socket, next) => {
            const req = socket.request as any;
            if (req.user) {
                return next(); 
            }

            next(new Error("No autorizado - Sin sesión de Google activa"));
        });

        initAudioSocket(io);

        server.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err);
        process.exit(1);
    }
};

void startServer();

export { app, createApp };