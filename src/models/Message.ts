import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
    sala: Schema.Types.ObjectId;
    usuario: Schema.Types.ObjectId;
    contenido: string;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        sala: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'La sala del mensaje es obligatoria'],
        },
        usuario: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario del mensaje es obligatorio'],
        },
        contenido: {
            type: String,
            required: [true, 'El contenido del mensaje es obligatorio'],
            trim: true,
            maxlength: [1000, 'El mensaje no puede superar los 1000 caracteres'],
        },
    },
    {
        timestamps: true,
    }
);

MessageSchema.index({ sala: 1, createdAt: -1 });

export default model<IMessage>('Message', MessageSchema);
