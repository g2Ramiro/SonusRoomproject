import express from 'express';
import path from 'path';
import session from 'express-session';
import dummyRoutes from './routes/dummyRoutes';
import trackRoutes from './routes/trackRoutes';
import roomRoutes from './routes/roomRoutes';
import messageRoutes from './routes/messageRoutes';
import playlistRoutes from './routes/playlistRoutes';
import authRoutes from './routes/authRoutes';
import './config/passport';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { isAuthorized } from './middlewares/authMiddleware';
import { swaggerSpec } from './config/swagger';

export const sessionMiddleware = session({
    secret: 'Secreto seguro de SonusRoom',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
});

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(sessionMiddleware);
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customSiteTitle: 'SonusRoom API Docs',
        })
    );
    app.get('/api-docs.json', (_req, res) => {
        res.json(swaggerSpec);
    });
    app.use('/api/auth', authRoutes);
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'login.html'));
    });
    app.get('/', (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return res.redirect('/dashboard');
        }
        res.redirect('/login');
    });
    app.use('/api', dummyRoutes);
    app.use('/api/tracks', isAuthorized, trackRoutes);
    app.use('/api/rooms', isAuthorized, roomRoutes);
    app.use('/api/messages', isAuthorized, messageRoutes);
    app.use('/api/playlists', isAuthorized, playlistRoutes);
    app.get('/dashboard', isAuthorized, (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'index.html'));
    });
    app.use(isAuthorized, express.static(path.join(__dirname, 'views')));

    return app;
}