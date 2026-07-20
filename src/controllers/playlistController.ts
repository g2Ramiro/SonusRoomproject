import { Request, Response } from 'express';
import Playlist from '../models/Playlist';
import Track from '../models/Track';

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Error desconocido';

const ALLOWED_UPDATE_FIELDS = ['nombre', 'descripcion', 'esPublica'] as const;

// Crear una playlist
export const createPlaylist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, descripcion, esPublica, tracks } = req.body;
        const usuarioLogueado = req.user as { _id: string };

        if (!nombre || !String(nombre).trim()) {
            res.status(400).json({ error: 'El nombre de la playlist es requerido' });
            return;
        }

        const trackIds: string[] = Array.isArray(tracks) ? tracks : [];

        if (trackIds.length > 0) {
            const existingCount = await Track.countDocuments({ _id: { $in: trackIds } });
            if (existingCount !== trackIds.length) {
                res.status(400).json({ error: 'Uno o más tracks no existen' });
                return;
            }
        }

        const newPlaylist = new Playlist({
            nombre: String(nombre).trim(),
            descripcion: descripcion ? String(descripcion).trim() : '',
            propietario: usuarioLogueado._id,
            tracks: trackIds,
            esPublica: esPublica === undefined ? true : Boolean(esPublica),
        });

        const savedPlaylist = await newPlaylist.save();
        const populated = await Playlist.findById(savedPlaylist._id)
            .populate('propietario', 'nombre email avatar')
            .populate('tracks');

        res.status(201).json({
            mensaje: 'Playlist creada exitosamente',
            playlist: populated,
        });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al crear la playlist',
            detalles: getErrorMessage(error),
        });
    }
};

// Listar playlists
export const getAllPlaylists = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter: Record<string, unknown> = {};
        if (req.query.propietarioId) {
            filter.propietario = req.query.propietarioId;
        }

        const playlists = await Playlist.find(filter)
            .sort({ createdAt: -1 })
            .populate('propietario', 'nombre email avatar')
            .populate('tracks');

        res.status(200).json(playlists);
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al listar las playlists',
            detalles: getErrorMessage(error),
        });
    }
};

// Obtener playlist por ID
export const getPlaylistById = async (req: Request, res: Response): Promise<void> => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('propietario', 'nombre email avatar')
            .populate('tracks');

        if (!playlist) {
            res.status(404).json({ mensaje: 'Playlist no encontrada' });
            return;
        }

        res.status(200).json(playlist);
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al buscar la playlist',
            detalles: getErrorMessage(error),
        });
    }
};

// Actualizar datos de una playlist
export const updatePlaylist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, descripcion, esPublica, tracks } = req.body;

        if (nombre !== undefined && !String(nombre).trim()) {
            res.status(400).json({ error: 'El nombre de la playlist no puede estar vacío' });
            return;
        }

        const updates: Record<string, unknown> = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (tracks !== undefined) {
            if (!Array.isArray(tracks)) {
                res.status(400).json({ error: 'tracks debe ser un arreglo de IDs' });
                return;
            }
            if (tracks.length > 0) {
                const existingCount = await Track.countDocuments({ _id: { $in: tracks } });
                if (existingCount !== tracks.length) {
                    res.status(400).json({ error: 'Uno o más tracks no existen' });
                    return;
                }
            }
            updates.tracks = tracks;
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({
                error: 'Debes enviar al menos un campo válido (nombre, descripcion, esPublica, tracks)',
            });
            return;
        }

        if (updates.nombre !== undefined) {
            updates.nombre = String(nombre).trim();
        }
        if (updates.descripcion !== undefined) {
            updates.descripcion = String(descripcion).trim();
        }
        if (updates.esPublica !== undefined) {
            updates.esPublica = Boolean(esPublica);
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        })
            .populate('propietario', 'nombre email avatar')
            .populate('tracks');

        if (!updatedPlaylist) {
            res.status(404).json({ mensaje: 'Playlist no encontrada' });
            return;
        }

        res.status(200).json({
            mensaje: 'Playlist actualizada',
            playlist: updatedPlaylist,
        });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al actualizar la playlist',
            detalles: getErrorMessage(error),
        });
    }
};

// Eliminar una playlist
export const deletePlaylist = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedPlaylist = await Playlist.findByIdAndDelete(req.params.id);
        if (!deletedPlaylist) {
            res.status(404).json({ mensaje: 'Playlist no encontrada' });
            return;
        }

        res.status(200).json({ mensaje: 'Playlist eliminada correctamente' });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al eliminar la playlist',
            detalles: getErrorMessage(error),
        });
    }
};
