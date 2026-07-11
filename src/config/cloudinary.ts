import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

//Credenciales de acceso a la nube donde se almacenaran las canciones
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuracion del almacenamiento
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async () => {
        return {
            folder: 'sonusroom_tracks',
            resource_type: 'video', //Formatos mp3 que representan los audios
            format: 'mp3',
        };
    },
});

//Uso de multer para cargar datos del archivo
const uploadCloud = multer({ storage: storage });

export default uploadCloud;
