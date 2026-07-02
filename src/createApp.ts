import express from 'express';
import path from 'path';

import dummyRoutes from './routes/dummyRoutes';
import trackRoutes from './routes/trackRoutes';
import roomRoutes from './routes/roomRoutes';

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'views')));

    app.use('/api', dummyRoutes);
    app.use('/api/tracks', trackRoutes);
    app.use('/api/rooms', roomRoutes);

    return app;
}
