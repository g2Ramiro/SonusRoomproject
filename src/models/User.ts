import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    googleId: string;
    nombre: string;
    correo: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        googleId: { type: String, required: true, unique: true },
        nombre: { type: String, required: true },
        correo: { type: String, required: true, unique: true },
        avatar: { type: String },
    },
    { timestamps: true },
);

export default model<IUser>('User', UserSchema);
