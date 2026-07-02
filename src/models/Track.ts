import { Schema, model, Document } from 'mongoose';

export interface ITrack extends Document {
    titulo: string;
    artista: string;
    urlAudio: string;
    duracion: number;
    letra?: string;
    subidoPor: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TrackSchema = new Schema<ITrack>(
    {
        titulo: {
            type: String,
            required: [true, 'El título de la canción es obligatorio'],
            trim: true,
        },
        artista: {
            type: String,
            default: 'Artista Desconocido',
            trim: true,
        },
        urlAudio: {
            type: String,
            required: [true, 'La URL del archivo de audio es obligatoria'],
        },
        duracion: {
            type: Number,
            default: 0,
        },
        letra: {
            type: String,
            default: '',
        },
        subidoPor: {
            type: Schema.Types.ObjectId,
            ref: 'User', // Aqui debe ir referencia a User
            required: true,
        },
    },
    {
        timestamps: true, //Propiedades createdAt y updatedAt
    },
);

export default model<ITrack>('Track', TrackSchema);
