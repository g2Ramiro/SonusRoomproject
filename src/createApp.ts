import express from 'express';
import path from 'path';
import session from 'express-session';
import dummyRoutes from './routes/dummyRoutes';
import trackRoutes from './routes/trackRoutes';
import roomRoutes from './routes/roomRoutes';
import authRoutes from './routes/authRoutes';
import './config/passport';
import passport from 'passport';
import { isAuthorized } from './middlewares/authMiddleware';

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
    app.use('/api', isAuthorized, dummyRoutes);
    app.use('/api/tracks', isAuthorized, trackRoutes);
    app.use('/api/rooms', isAuthorized, roomRoutes);
    app.get('/dashboard', isAuthorized, (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'index.html'));
    });
    app.use(isAuthorized, express.static(path.join(__dirname, 'views')));

    return app;
}