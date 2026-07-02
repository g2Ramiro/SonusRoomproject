import { Request, Response } from 'express';
import Track from '../models/Track';

// Interfaz de Multer para el contenido tecnico del archivo
interface MulterRequest extends Request {
    file?: any;
}

//Agregar una nueva canción subiendo el archivo real a la nube de Cloudinary
export const createTrack = async (req: Request, res: Response): Promise<void> => {
    try {
        const multerReq = req as MulterRequest;
        const { titulo, artista, duracion } = multerReq.body;

        // Validacion con Cloudinary
        if (!multerReq.file) {
            res.status(400).json({ error: 'Es obligatorio subir un archivo de audio (.mp3)' });
            return;
        }

        const urlAudio = multerReq.file.path;
        const usuarioSimuladoId = '666f6f2d6261722d71757578'; //Mismo usuario para pruebas de momento

        const newTrack = new Track({
            //Creacion de cancion basandose en datos recopilados con multer
            titulo,
            artista: artista || 'Artista Desconocido',
            urlAudio,
            duracion: duracion ? Number(duracion) : 0,
            subidoPor: usuarioSimuladoId,
        });

        const savedTrack = await newTrack.save();
        res.status(201).json({
            mensaje: 'Canción subida registrada con éxito',
            track: savedTrack,
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al procesar la subida del archivo', detalles: error.message });
    }
};

//Consultar canciones registradas
export const getAllTracks = async (req: Request, res: Response): Promise<void> => {
    try {
        const tracks = await Track.find();
        res.status(200).json(tracks);
    } catch (error: any) {
        res.status(500).json({ error: 'Error al obtener las canciones', detalles: error.message });
    }
};

// Consultar cancion por su ID de MongoDB
export const getTrackById = async (req: Request, res: Response): Promise<void> => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            res.status(404).json({ mensaje: 'Canción no encontrada' });
            return;
        }
        res.status(200).json(track);
    } catch (error: any) {
        res.status(500).json({ error: 'Error al buscar la canción', detalles: error.message });
    }
};

//Modificar datos de una canción
export const updateTrack = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedTrack = await Track.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTrack) {
            res.status(404).json({ mensaje: 'Canción no encontrada' });
            return;
        }
        res.status(200).json({ mensaje: 'Canción actualizada', track: updatedTrack });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al actualizar la canción', detalles: error.message });
    }
};

//Eliminar un registro de canción de la base de datos
export const deleteTrack = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedTrack = await Track.findByIdAndDelete(req.params.id);
        if (!deletedTrack) {
            res.status(404).json({ mensaje: 'Canción no encontrada' });
            return;
        }
        res.status(200).json({ mensaje: 'Canción eliminada correctamente' });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al eliminar la canción', detalles: error.message });
    }
};
