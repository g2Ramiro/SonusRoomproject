import { Schema, model, Document } from 'mongoose';

export interface IRoom extends Document {
    nombreSala: string;
    codigoAcceso: string;
    host: Schema.Types.ObjectId; 
    cancionActual: Schema.Types.ObjectId | null;
    estaReproduciendo: boolean;
    colaReproduccion: Schema.Types.ObjectId[];
    usuariosActivos: string[];
    createdAt: Date;
    updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
    nombreSala: { 
        type: String, 
        required: [true, 'El nombre de la sala es obligatorio'],
        trim: true 
    },
    codigoAcceso: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    host: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    cancionActual: { 
        type: Schema.Types.ObjectId, 
        ref: 'Track', 
        default: null 
    },
    estaReproduciendo: { 
        type: Boolean, 
        default: false 
    },
    colaReproduccion:[ {
        type: Schema.Types.ObjectId,
        ref: 'Track',
        default: []

    }],
    usuariosActivos: { 
        type: [String], 
        default: [] 
    }
}, {
    timestamps: true 
});

export default model<IRoom>('Room', RoomSchema);