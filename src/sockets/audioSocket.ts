
import { Server, Socket } from 'socket.io';
import Room from '../models/Room';

export default (io: Server) => {
    
    //Intercepta y valida la sesión de Google
    io.use((socket: Socket, next) => {
        const req = socket.request as any;
        
        if (req.user) {
            socket.data.usuario = req.user;
            return next();
        }
        
        return next(new Error('No autorizado: Debes iniciar sesión con Google primero.'));
    });

    // Manejo de eventos de sockets
    io.on('connection', (socket: Socket) => {
        const usuarioActual = socket.data.usuario;
        console.log(`Usuario conectado al socket de forma segura: ${usuarioActual.nombre} (${socket.id})`);

        // Unirse a una sala usando su roomCode
        socket.on('join-room', async (roomCode: string) => {
            socket.join(roomCode.toUpperCase());
            console.log(`Sockets: ${usuarioActual.nombre} se unió a la sala dinámica: ${roomCode.toUpperCase()}`);

            // Emitir el estado actual de la sala al usuario que se unió
            try {
                const roomData = await Room.findOne({ codigoAcceso: roomCode.toUpperCase() }).populate('cancionActual');
                if (roomData && roomData.cancionActual) {
                    const trackDoc = roomData.cancionActual as any;
                    socket.emit('room-sync-init', {
                        urlAudio: trackDoc.urlTrack || trackDoc.urlAudio,
                        estaReproduciendo: roomData.estaReproduciendo,
                        currentTime: 0
                    });
                }
            } catch (error: any) {
                console.error("Error al inicializar sincronización de sala:", error.message);
            }
        });

        // Controlar las acciones del reproductor (Play / Pausa) sincronizadas con MongoDB
        socket.on('player-action', async (data: any) => {
            const roomCode = data.roomCode || data.roomId;
            const { action, currentTime, trackId } = data;
            
            console.log(`Acción [${action}] en sala [${roomCode}] por [${usuarioActual.nombre}] - Tiempo: ${currentTime}s`);

            try {
                const updateData: any = { estaReproduciendo: (action === 'play') };
                
                if (trackId) {
                    updateData.cancionActual = trackId;
                }

                const updatedRoom = await Room.findOneAndUpdate(
                    { codigoAcceso: roomCode.toUpperCase() },
                    updateData,
                    { new: true }
                ).populate('cancionActual');

                if (updatedRoom) {
                    const trackDoc = updatedRoom.cancionActual as any;
                    socket.to(roomCode.toUpperCase()).emit('player-broadcast', {
                        action,
                        currentTime,
                        urlAudio: trackDoc ? (trackDoc.urlTrack || trackDoc.urlAudio) : null,
                        cambiadoPor: usuarioActual.nombre
                    });
                }
            } catch (error: any) {
                console.error("Error al guardar el estado del player en Mongo:", error.message);
            }
        });

        // Escuchar cuando un cliente avisa que subió una canción con éxito
        socket.on('cola-actualizada', (data: { codigoAcceso: string, colaReproduccion: any[] }) => {
            const { codigoAcceso, colaReproduccion } = data;
            console.log(`Sockets: Fila actualizada en sala [${codigoAcceso.toUpperCase()}] por [${usuarioActual.nombre}]`);

            socket.to(codigoAcceso.toUpperCase()).emit('actualizar-cola-broadcast', {
                colaReproduccion
            });
        });

        // Escuchar cuando un cliente solicita avanzar a la siguiente canción
        socket.on('next-track', async (data: { roomCode: string }) => {
            const { roomCode } = data;
            
            try {
                const room = await Room.findOne({ codigoAcceso: roomCode.toUpperCase() });
                
                if (!room) {
                    console.error(`Sala no encontrada en sockets: ${roomCode}`);
                    return;
                }

                if (room.colaReproduccion && room.colaReproduccion.length > 0) {
                    //Extrae el primer track del array (colaReproduccion)
                    const siguienteTrackId = room.colaReproduccion.shift();
                    
                    // Actualiza la sala con el siguiente track y marca que se está reproduciendo
                    room.cancionActual = siguienteTrackId ?? null;
                    room.estaReproduciendo = true;

                    // Marca el campo modificado para que Mongoose lo reconozca
                    room.markModified('colaReproduccion');

                    //Guarda cambios
                    await room.save();

                    //Recupera el documento poblado usando tus llaves reales del esquema
                    const roomActualizada = await Room.findById(room._id)
                        .populate('cancionActual')
                        .populate('colaReproduccion');

                    if (roomActualizada && roomActualizada.cancionActual) {
                        const trackDoc = roomActualizada.cancionActual as any;
                        
                        // Usamos las llaves reales del esquema para obtener la URL y el título de la canción
                        const urlDirectaCloudinary = trackDoc.urlTrack || trackDoc.urlAudio;
                        const tituloCancion = trackDoc.nombreTrack || trackDoc.nombreCancion || trackDoc.titulo;

                        console.log(`Sockets: Avanzando con Schema real a la rola: ${tituloCancion}`);
                        console.log(`URL Enviada al Frontend: ${urlDirectaCloudinary}`);
                        
                        // Mandamos la orden de reproducción al frontend
                        io.to(roomCode.toUpperCase()).emit('player-broadcast', {
                            action: 'play',
                            currentTime: 0,
                            urlAudio: urlDirectaCloudinary
                        });

                        // Sincroniza la lista de la cola en el HTML
                        io.to(roomCode.toUpperCase()).emit('actualizar-cola-broadcast', {
                            colaReproduccion: roomActualizada.colaReproduccion
                        });
                    }
                } else {
                    // Si ya se vació la lista por completo
                    room.cancionActual = null;
                    room.estaReproduciendo = false;
                    room.markModified('colaReproduccion');
                    await room.save();

                    console.log(`Sockets: La cola de la sala [${roomCode}] se ha vaciado.`);
                    
                    io.to(roomCode.toUpperCase()).emit('player-broadcast', {
                        action: 'pause',
                        currentTime: 0,
                        urlAudio: null
                    });

                    io.to(roomCode.toUpperCase()).emit('actualizar-cola-broadcast', {
                        colaReproduccion: []
                    });
                }

            } catch (error: any) {
                console.error("Error", error.message);
            }
        });

        // Manejar la desconexión del socket
        socket.on('disconnect', () => {
            console.log(`Usuario disconnected del socket: ${usuarioActual.nombre} (${socket.id})`);
        });
    });
};