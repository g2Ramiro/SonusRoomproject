import { Schema, model, Document } from 'mongoose';

export interface IPlaylist extends Document {
    nombre: string;
    descripcion?: string;
    creador: Schema.Types.ObjectId;
    canciones: Schema.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const PlaylistSchema = new Schema<IPlaylist>(
    {
        nombre: { type: String, required: true },
        descripcion: { type: String },
        creador: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        canciones: [{ type: Schema.Types.ObjectId, ref: 'Track' }],
    },
    { timestamps: true },
);

export default model<IPlaylist>('Playlist', PlaylistSchema);
