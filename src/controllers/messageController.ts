import { Request, Response } from 'express';
import Message from '../models/Message';
import Room from '../models/Room';

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Error desconocido';

// Crear un mensaje en una sala
export const createMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { salaId, contenido } = req.body;
        const usuarioLogueado = req.user as { _id: string };

        if (!salaId || !String(salaId).trim()) {
            res.status(400).json({ error: 'El salaId es requerido' });
            return;
        }

        if (!contenido || !String(contenido).trim()) {
            res.status(400).json({ error: 'El contenido del mensaje es requerido' });
            return;
        }

        const sala = await Room.findById(salaId);
        if (!sala) {
            res.status(404).json({ error: 'La sala especificada no existe' });
            return;
        }

        const newMessage = new Message({
            sala: sala._id,
            usuario: usuarioLogueado._id,
            contenido: String(contenido).trim(),
        });

        const savedMessage = await newMessage.save();
        const populated = await Message.findById(savedMessage._id)
            .populate('usuario', 'nombre email avatar')
            .populate('sala', 'nombreSala codigoAcceso');

        res.status(201).json({
            mensaje: 'Mensaje creado exitosamente',
            message: populated,
        });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al crear el mensaje',
            detalles: getErrorMessage(error),
        });
    }
};

// Listar mensajes (opcionalmente filtrados por sala)
export const getAllMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter: Record<string, unknown> = {};
        if (req.query.salaId) {
            filter.sala = req.query.salaId;
        }

        const messages = await Message.find(filter)
            .sort({ createdAt: -1 })
            .populate('usuario', 'nombre email avatar')
            .populate('sala', 'nombreSala codigoAcceso');

        res.status(200).json(messages);
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al listar los mensajes',
            detalles: getErrorMessage(error),
        });
    }
};

// Obtener un mensaje por ID
export const getMessageById = async (req: Request, res: Response): Promise<void> => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('usuario', 'nombre email avatar')
            .populate('sala', 'nombreSala codigoAcceso');

        if (!message) {
            res.status(404).json({ mensaje: 'Mensaje no encontrado' });
            return;
        }

        res.status(200).json(message);
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al buscar el mensaje',
            detalles: getErrorMessage(error),
        });
    }
};

// Actualizar contenido de un mensaje
export const updateMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { contenido } = req.body;

        if (!contenido || !String(contenido).trim()) {
            res.status(400).json({ error: 'El contenido del mensaje es requerido' });
            return;
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            req.params.id,
            { contenido: String(contenido).trim() },
            { new: true, runValidators: true }
        )
            .populate('usuario', 'nombre email avatar')
            .populate('sala', 'nombreSala codigoAcceso');

        if (!updatedMessage) {
            res.status(404).json({ mensaje: 'Mensaje no encontrado' });
            return;
        }

        res.status(200).json({
            mensaje: 'Mensaje actualizado',
            message: updatedMessage,
        });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al actualizar el mensaje',
            detalles: getErrorMessage(error),
        });
    }
};

// Eliminar un mensaje
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedMessage = await Message.findByIdAndDelete(req.params.id);
        if (!deletedMessage) {
            res.status(404).json({ mensaje: 'Mensaje no encontrado' });
            return;
        }

        res.status(200).json({ mensaje: 'Mensaje eliminado correctamente' });
    } catch (error: unknown) {
        res.status(500).json({
            error: 'Error al eliminar el mensaje',
            detalles: getErrorMessage(error),
        });
    }
};
