import express from 'express';
import path from 'path';
import session from 'express-session';
import dummyRoutes from './routes/dummyRoutes';
import trackRoutes from './routes/trackRoutes';
import roomRoutes from './routes/roomRoutes';
import authRoutes from './routes/authRoutes';
import './config/passport';
import passport from 'passport';

// Middleware de sesión para que Socket.io lo pueda reutilizar en app.ts
export const sessionMiddleware = session({
    secret: 'Secreto seguro de SonusRoom',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
});

export function createApp() {
    const app = express();
    
    // Middlewares
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'views')));
    app.use(express.urlencoded({ extended: true }));
    
    // Usar el middleware de sesión compartido
    app.use(sessionMiddleware);
    
    // Passport Auth
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Rutas de la API
    app.use('/api', dummyRoutes);
    app.use('/api/tracks', trackRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/auth', authRoutes);
    
    return app;
}