import { Server, Socket } from 'socket.io';
import Room from '../models/Room';
import { ITrack } from '../models/Track';

interface PlayerActionData {
    roomCode?: string;
    roomId?: string;
    action: 'play' | 'pause';
    currentTime: number;
    trackId?: string;
}

interface RoomPlayerUpdate {
    estaReproduciendo: boolean;
    cancionActual?: string;
}

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Error desconocido');

const getPopulatedTrack = (cancionActual: unknown): ITrack | null => {
    if (cancionActual && typeof cancionActual === 'object' && 'urlAudio' in cancionActual) {
        return cancionActual as ITrack;
    }
    return null;
};

export default (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`Usuario conectado al socket: ${socket.id}`); //Permite identificar cuando se abren dos pestañas diferentes cuando se corre localhost

        //Gracias a el id de las salas en mongoDB, se usa un roomCode para unirse
        socket.on('join-room', async (roomCode: string) => {
            socket.join(roomCode);
            console.log(`Sockets: Usuario conectado a la sala dinámica: ${roomCode}`);

            try {
                const roomData = await Room.findOne({ codigoAcceso: roomCode }).populate('cancionActual');
                const track = roomData ? getPopulatedTrack(roomData.cancionActual) : null;

                if (track) {
                    socket.emit('room-sync-init', {
                        urlAudio: track.urlAudio,
                        estaReproduciendo: roomData?.estaReproduciendo,
                        currentTime: 0,
                    });
                }
            } catch (error: unknown) {
                console.error('Error al inicializar sincronización de sala:', getErrorMessage(error));
            }
        });

        //Controlar las acciones del reproductor sincronizadas con MongoDB
        socket.on('player-action', async (data: PlayerActionData) => {
            const roomCode = data.roomCode || data.roomId;
            const { action, currentTime, trackId } = data;

            if (!roomCode) {
                return;
            }

            console.log(`Acción [${action}] en sala [${roomCode}] - Tiempo: ${currentTime}s`);

            try {
                const updateData: RoomPlayerUpdate = { estaReproduciendo: action === 'play' };

                if (trackId) {
                    updateData.cancionActual = trackId;
                }

                const updatedRoom = await Room.findOneAndUpdate({ codigoAcceso: roomCode }, updateData, {
                    new: true,
                }).populate('cancionActual');

                if (updatedRoom) {
                    const track = getPopulatedTrack(updatedRoom.cancionActual);

                    socket.to(roomCode).emit('player-broadcast', {
                        action,
                        currentTime,
                        urlAudio: track?.urlAudio ?? null,
                    });
                }
            } catch (error: unknown) {
                console.error('Error al guardar el estado del player en Mongo:', getErrorMessage(error));
            }
        });

        socket.on('disconnect', () => {
            console.log(`Usuario desconectado del socket: ${socket.id}`);
        });
    });
};
