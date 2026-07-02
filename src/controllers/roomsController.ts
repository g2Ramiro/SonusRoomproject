import { Request, Response } from 'express';
import Room from '../models/Room';

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Error desconocido');

const generateRoomCode = (): string => {
    //Generar Ids randoms para las salas que se creen
    return 'ROOM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

//Crear una sala
export const createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombreSala } = req.body;

        if (!nombreSala) {
            res.status(400).json({ error: 'El nombre de la sala es requerido' });
            return;
        }

        const hostSimuladoId = '666f6f2d6261722d71757578'; //Mismo host para cada room creada de momento

        const newRoom = new Room({
            nombreSala,
            codigoAcceso: generateRoomCode(),
            host: hostSimuladoId,
            cancionActual: null,
        });

        const savedRoom = await newRoom.save();
        res.status(201).json({ mensaje: 'Sala creada exitosamente', sala: savedRoom });
    } catch (error: unknown) {
        res.status(500).json({ error: 'Error al crear la sala', detalles: getErrorMessage(error) });
    }
};

//Obtener todas las salas
export const getAllRooms = async (_req: Request, res: Response): Promise<void> => {
    try {
        const rooms = await Room.find().populate('cancionActual');
        res.status(200).json(rooms);
    } catch (error: unknown) {
        res.status(500).json({ error: 'Error al listar las salas', detalles: getErrorMessage(error) });
    }
};

//Actualizar estado de la sala true or false dependiendo si se reproduce una cancion
export const updateRoomState = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cancionActual, estaReproduciendo } = req.body;

        const updatedRoom = await Room.findOneAndUpdate(
            { codigoAcceso: req.params.codigo },
            { cancionActual, estaReproduciendo },
            { new: true },
        );

        if (!updatedRoom) {
            res.status(404).json({ mensaje: 'Sala no encontrada' });
            return;
        }
        res.status(200).json({ mensaje: 'Estado de sala actualizado', sala: updatedRoom });
    } catch (error: unknown) {
        res.status(500).json({ error: 'Error al actualizar la sala', detalles: getErrorMessage(error) });
    }
};

//Eliminar sala
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedRoom = await Room.findOneAndDelete({ codigoAcceso: req.params.codigo });
        if (!deletedRoom) {
            res.status(404).json({ mensaje: 'Sala no encontrada' });
            return;
        }
        res.status(200).json({ mensaje: 'Sala cerrada y eliminada correctamente' });
    } catch (error: unknown) {
        res.status(500).json({ error: 'Error al eliminar la sala', detalles: getErrorMessage(error) });
    }
};
