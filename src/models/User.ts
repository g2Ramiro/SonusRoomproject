import {Schema, model, Document} from 'mongoose';

export interface IUser extends Document{
    googleId: string;
    nombre: string;
    email: string;
    avatar?: string;
    createdAt: Date;
}

//Schema para base de datos de Mongo
const userSchema = new Schema<IUser>(
    {
        googleId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    nombre: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    avatar: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
    }
)

export default model<IUser>('User',userSchema);