import { Request, Response } from 'express';
import Room from '../models/Room';
import Track from '../models/Track';

const generateRoomCode = (): string => { //Ids randoms para las salas que se creen
    return 'ROOM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

//Crear una sala
export const createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombreSala } = req.body;

        if (!nombreSala) {
            res.status(400).json({ error: "El nombre de la sala es requerido" });
            return;
        }
        const usuarioLogueado = req.user as any;

        const newRoom = new Room({
            nombreSala,
            codigoAcceso: generateRoomCode(),
            host: usuarioLogueado._id,
            cancionActual: null
        });

        const savedRoom = await newRoom.save();
        // Envías el código de acceso directo en la raíz para que el front lo lea de inmediato
        res.status(201).json({
            mensaje: "Sala creada exitosamente",
            codigoAcceso: savedRoom.codigoAcceso,
            sala: savedRoom
        });
    } catch (error: any) {
        res.status(500).json({ error: "Error al crear la sala", detalles: error.message });
    }
};

//Obtener todas las salas
export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const rooms = await Room.find()
            .populate('cancionActual')
            .populate('host', 'nombre email avatar');

        res.status(200).json(rooms);
    } catch (error: any) {
        res.status(500).json({ error: "Error al listar las salas", detalles: error.message });
    }
};

//Actualizar estado de la sala true or false dependiendo si se reproduce una cancion
export const updateRoomState = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cancionActual, estaReproduciendo } = req.body;

        if (cancionActual === undefined && estaReproduciendo === undefined) {
            res.status(400).json({
                error: "Debes enviar cancionActual y/o estaReproduciendo para actualizar la sala"
            });
            return;
        }

        if (estaReproduciendo !== undefined && typeof estaReproduciendo !== 'boolean') {
            res.status(400).json({ error: "estaReproduciendo debe ser un booleano" });
            return;
        }

        const updates: Record<string, unknown> = {};
        if (cancionActual !== undefined) updates.cancionActual = cancionActual;
        if (estaReproduciendo !== undefined) updates.estaReproduciendo = estaReproduciendo;

        const updatedRoom = await Room.findOneAndUpdate(
            { codigoAcceso: req.params.codigo },
            updates,
            { new: true }
        );

        if (!updatedRoom) {
            res.status(404).json({ mensaje: "Sala no encontrada" });
            return;
        }
        res.status(200).json({ mensaje: "Estado de sala actualizado", sala: updatedRoom });
    } catch (error: any) {
        res.status(500).json({ error: "Error al actualizar la sala", detalles: error.message });
    }
};

//Eliminar sala
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedRoom = await Room.findOneAndDelete({ codigoAcceso: req.params.codigo });
        if (!deletedRoom) {
            res.status(404).json({ mensaje: "Sala no encontrada" });
            return;
        }
        res.status(200).json({ mensaje: "Sala cerrada y eliminada correctamente" });
    } catch (error: any) {
        res.status(500).json({ error: "Error al eliminar la sala", detalles: error.message });
    }
};
//Añadir cancion a la cola de reproduccion
export const addQueue = async (req: Request, res: Response): Promise<void> => {
    try {
        const { codigo } = req.params;
        const { nombreCancion, artista } = req.body;
        const usuarioLogueado = req.user as any;

        if (!nombreCancion || !String(nombreCancion).trim()) {
            res.status(400).json({ error: "El nombre de la canción es requerido" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: "No se proporcionó ningún archivo de audio válido" });
            return;
        }

        //Crear el documento del Track en MongoDB
        const nuevoTrack = new Track({
            titulo: String(nombreCancion).trim(),
            artista: (artista && String(artista).trim()) || "Artista Desconocido",
            urlAudio: req.file.path,
            subidoPor: usuarioLogueado._id
        });

        const trackGuardado = await nuevoTrack.save();

        const salaActualizada = await Room.findOneAndUpdate(
            { codigoAcceso: codigo },
            { $push: { colaReproduccion: trackGuardado._id } },
            { new: true }
        ).populate('colaReproduccion');

        if (!salaActualizada) {
            res.status(404).json({ error: "La sala especificada no existe" });
            return;
        }

        res.status(201).json({
            mensaje: "Canción subida e integrada a la fila de espera con éxito",
            track: trackGuardado,
            colaActual: salaActualizada.colaReproduccion
        });

    } catch (error: any) {
        res.status(500).json({ error: "Error al añadir la canción a la cola", detalles: error.message });
    }
};

// Añadir un track ya existente a la cola de la sala
export const addExistingTrackToQueue = async (req: Request, res: Response): Promise<void> => {
    try {
        const { codigo } = req.params;
        const { trackId } = req.body;

        if (!trackId || !String(trackId).trim()) {
            res.status(400).json({ error: "El trackId es requerido" });
            return;
        }

        const track = await Track.findById(trackId);
        if (!track) {
            res.status(404).json({ error: "La canción especificada no existe" });
            return;
        }

        const salaActualizada = await Room.findOneAndUpdate(
            { codigoAcceso: codigo },
            { $push: { colaReproduccion: track._id } },
            { new: true }
        ).populate('colaReproduccion');

        if (!salaActualizada) {
            res.status(404).json({ error: "La sala especificada no existe" });
            return;
        }

        res.status(200).json({
            mensaje: "Canción añadida a la fila de espera",
            track,
            colaActual: salaActualizada.colaReproduccion
        });
    } catch (error: any) {
        res.status(500).json({ error: "Error al añadir el track a la cola", detalles: error.message });
    }
};