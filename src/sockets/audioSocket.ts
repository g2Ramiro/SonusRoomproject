import { Server, Socket } from 'socket.io';
import Room from '../models/Room';

export default (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`Usuario conectado al socket: ${socket.id}`); //Permite identificar cuando se abren dos pestañas diferentes cuando se corre localhost

        //Gracias a el id de las salas en mongoDB, se usa un roomCode para unirse
        socket.on('join-room', async (roomCode: string) => {
            socket.join(roomCode);
            console.log(`Sockets: Usuario conectado a la sala dinámica: ${roomCode}`);

            try {
                const roomData = await Room.findOne({ codigoAcceso: roomCode }).populate('cancionActual');
                if (roomData && roomData.cancionActual) {
                    socket.emit('room-sync-init', {
                        urlAudio: (roomData.cancionActual as any).urlAudio,
                        estaReproduciendo: roomData.estaReproduciendo,
                        currentTime: 0,
                    });
                }
            } catch (error: any) {
                console.error('Error al inicializar sincronización de sala:', error.message);
            }
        });

        //Controlar las acciones del reproductor sincronizadas con MongoDB
        socket.on('player-action', async (data: any) => {
            const roomCode = data.roomCode || data.roomId;
            const { action, currentTime, trackId } = data;

            console.log(`Acción [${action}] en sala [${roomCode}] - Tiempo: ${currentTime}s`);

            try {
                const updateData: any = { estaReproduciendo: action === 'play' };

                if (trackId) {
                    updateData.cancionActual = trackId;
                }

                const updatedRoom = await Room.findOneAndUpdate({ codigoAcceso: roomCode }, updateData, {
                    new: true,
                }).populate('cancionActual');

                if (updatedRoom) {
                    socket.to(roomCode).emit('player-broadcast', {
                        action,
                        currentTime,
                        urlAudio: updatedRoom.cancionActual ? (updatedRoom.cancionActual as any).urlAudio : null,
                    });
                }
            } catch (error: any) {
                console.error('Error al guardar el estado del player en Mongo:', error.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Usuario desconectado del socket: ${socket.id}`);
        });
    });
};
