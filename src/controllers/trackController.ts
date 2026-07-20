import { Request, Response } from 'express';
import Track from '../models/Track';
import {
    fetchLyricsFromExternalApi,
    LyricsApiError,
    LyricsNotFoundError,
} from '../services/lyricsService';

interface CloudinaryFile extends Express.Multer.File {
    path: string;
}

interface MulterRequest extends Request {
    file?: CloudinaryFile;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Error desconocido';

const ALLOWED_UPDATE_FIELDS = ['titulo', 'artista', 'duracion', 'letra'] as const;

// Agregar una nueva canción subiendo el archivo real a la nube de Cloudinary
export const createTrack = async (req: Request, res: Response): Promise<void> => {
    try {
        const multerReq = req as MulterRequest;
        const { titulo, artista, duracion } = multerReq.body;

        if (!titulo || !String(titulo).trim()) {
            res.status(400).json({ error: 'El título de la canción es requerido' });
            return;
        }

        if (!multerReq.file) {
            res.status(400).json({ error: 'Es obligatorio subir un archivo de audio (.mp3)' });
            return;
        }

        const usuarioLogueado = req.user as { _id: string };

        const newTrack = new Track({
            titulo: String(titulo).trim(),
            artista: (artista && String(artista).trim()) || 'Artista Desconocido',
            urlAudio: multerReq.file.path,
            duracion: duracion ? Number(duracion) : 0,
            subidoPor: usuarioLogueado._id,
        });

        const savedTrack = await newTrack.save();
        res.status(201).json({
            mensaje: 'Canción subida registrada con éxito',
            track: savedTrack,
        });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al procesar la subida del archivo',
            detalles: getErrorMessage(error),
        });
    }
};

// Consultar canciones registradas
export const getAllTracks = async (_req: Request, res: Response): Promise<void> => {
    try {
        const tracks = await Track.find().sort({ createdAt: -1 });
        res.status(200).json(tracks);
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al obtener las canciones',
            detalles: getErrorMessage(error),
        });
    }
};

// Consultar canción por su ID de MongoDB
export const getTrackById = async (req: Request, res: Response): Promise<void> => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            res.status(404).json({ mensaje: 'Canción no encontrada' });
            return;
        }
        res.status(200).json(track);
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al buscar la canción',
            detalles: getErrorMessage(error),
        });
    }
};

// Modificar datos de una canción
export const updateTrack = async (req: Request, res: Response): Promise<void> => {
    try {
        const { titulo, artista, duracion, letra } = req.body;

        if (titulo !== undefined && !String(titulo).trim()) {
            res.status(400).json({ error: 'El título de la canción no puede estar vacío' });
            return;
        }

        const updates: Record<string, unknown> = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({
                error: 'Debes enviar al menos un campo válido para actualizar (titulo, artista, duracion, letra)',
            });
            return;
        }

        if (updates.titulo !== undefined) {
            updates.titulo = String(titulo).trim();
        }
        if (updates.artista !== undefined) {
            updates.artista = String(artista).trim() || 'Artista Desconocido';
        }
        if (updates.duracion !== undefined) {
            const parsed = Number(duracion);
            if (Number.isNaN(parsed) || parsed < 0) {
                res.status(400).json({ error: 'La duración debe ser un número válido mayor o igual a 0' });
                return;
            }
            updates.duracion = parsed;
        }
        if (updates.letra !== undefined) {
            updates.letra = String(letra);
        }

        const updatedTrack = await Track.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedTrack) {
            res.status(404).json({ mensaje: 'Canción no encontrada' });
            return;
        }

        res.status(200).json({ mensaje: 'Canción actualizada', track: updatedTrack });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al actualizar la canción',
            detalles: getErrorMessage(error),
        });
    }
};

// Eliminar un registro de canción de la base de datos
export const deleteTrack = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedTrack = await Track.findByIdAndDelete(req.params.id);
        if (!deletedTrack) {
            res.status(404).json({ mensaje: 'Canción no encontrada' });
            return;
        }
        res.status(200).json({ mensaje: 'Canción eliminada correctamente' });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al eliminar la canción',
            detalles: getErrorMessage(error),
        });
    }
};

// Obtener letra desde Lyrics.ovh y guardarla en el track
export const fetchTrackLyrics = async (req: Request, res: Response): Promise<void> => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            res.status(404).json({ mensaje: 'Canción no encontrada' });
            return;
        }

        const artista = (req.body?.artista && String(req.body.artista).trim()) || track.artista;
        const titulo = (req.body?.titulo && String(req.body.titulo).trim()) || track.titulo;

        if (!artista || artista === 'Artista Desconocido') {
            res.status(400).json({
                error: 'Se necesita un artista válido para buscar la letra',
            });
            return;
        }

        const letra = await fetchLyricsFromExternalApi(artista, titulo);

        track.letra = letra;
        if (req.body?.artista && String(req.body.artista).trim()) {
            track.artista = String(req.body.artista).trim();
        }
        if (req.body?.titulo && String(req.body.titulo).trim()) {
            track.titulo = String(req.body.titulo).trim();
        }
        await track.save();

        res.status(200).json({
            mensaje: 'Letra obtenida de lyrics.ovh y guardada',
            fuente: 'https://api.lyrics.ovh',
            track,
        });
    } catch (error: unknown) {
        if (error instanceof LyricsNotFoundError) {
            res.status(404).json({ error: error.message, fuente: 'lyrics.ovh' });
            return;
        }
        if (error instanceof LyricsApiError) {
            res.status(502).json({ error: error.message, fuente: 'lyrics.ovh' });
            return;
        }
        res.status(500).json({
            error: 'Error al obtener la letra',
            detalles: getErrorMessage(error),
        });
    }
};
