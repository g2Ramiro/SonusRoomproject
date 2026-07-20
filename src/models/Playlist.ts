import { Schema, model, Document } from 'mongoose';

export interface IPlaylist extends Document {
    nombre: string;
    descripcion: string;
    propietario: Schema.Types.ObjectId;
    tracks: Schema.Types.ObjectId[];
    esPublica: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PlaylistSchema = new Schema<IPlaylist>(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre de la playlist es obligatorio'],
            trim: true,
        },
        descripcion: {
            type: String,
            default: '',
            trim: true,
            maxlength: [500, 'La descripción no puede superar los 500 caracteres'],
        },
        propietario: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El propietario de la playlist es obligatorio'],
        },
        tracks: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Track',
            },
        ],
        esPublica: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

PlaylistSchema.index({ propietario: 1, createdAt: -1 });

export default model<IPlaylist>('Playlist', PlaylistSchema);
