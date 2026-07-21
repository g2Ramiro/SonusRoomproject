import swaggerJsdoc from 'swagger-jsdoc';

const objectId = {
    type: 'string',
    pattern: '^[a-fA-F0-9]{24}$',
    example: '507f1f77bcf86cd799439011',
};

const errorResponses = {
    Unauthorized: {
        description: 'No existe una sesión de Google activa',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                    error: 'No autorizado',
                    mensaje: 'Debes iniciar sesión para realizar esta acción.',
                },
            },
        },
    },
    NotFound: {
        description: 'El recurso solicitado no existe',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
            },
        },
    },
};

const crudIdParameter = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'ID de MongoDB del recurso',
    schema: objectId,
};

export const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'SonusRoom REST API',
            version: '1.0.0',
            description:
                'API para salas de escucha compartidas, tracks, chat y playlists. ' +
                'Inicia sesión mediante `GET /api/auth/google` antes de probar rutas protegidas.',
        },
        servers: [
            {
                url: 'http://localhost:{port}',
                description: 'Servidor local',
                variables: {
                    port: {
                        default: '3000',
                        description: 'Puerto definido en la variable PORT',
                    },
                },
            },
        ],
        tags: [
            { name: 'Authentication', description: 'Sesión mediante Google OAuth 2.0' },
            { name: 'Rooms', description: 'Salas y cola de reproducción' },
            { name: 'Tracks', description: 'Biblioteca de audio y letras externas' },
            { name: 'Messages', description: 'Mensajes del chat de una sala' },
            { name: 'Playlists', description: 'Listas de reproducción de usuarios' },
            { name: 'System', description: 'Estado del servicio' },
        ],
        components: {
            securitySchemes: {
                sessionCookie: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'connect.sid',
                    description:
                        'Cookie creada por express-session después de autenticarse con Google.',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'No autorizado' },
                        mensaje: { type: 'string' },
                        detalles: { type: 'string' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: objectId,
                        googleId: { type: 'string' },
                        nombre: { type: 'string', example: 'Ada Lovelace' },
                        email: { type: 'string', format: 'email', example: 'ada@example.com' },
                        avatar: { type: 'string', format: 'uri' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Track: {
                    type: 'object',
                    required: ['titulo', 'urlAudio', 'subidoPor'],
                    properties: {
                        _id: objectId,
                        titulo: { type: 'string', example: 'Bohemian Rhapsody' },
                        artista: { type: 'string', example: 'Queen' },
                        urlAudio: { type: 'string', format: 'uri' },
                        duracion: { type: 'number', minimum: 0, example: 354 },
                        letra: { type: 'string', example: 'Is this the real life?...' },
                        subidoPor: objectId,
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Room: {
                    type: 'object',
                    required: ['nombreSala', 'codigoAcceso', 'host'],
                    properties: {
                        _id: objectId,
                        nombreSala: { type: 'string', example: 'Rock nocturno' },
                        codigoAcceso: { type: 'string', example: 'ROOM-A1B2' },
                        host: { oneOf: [objectId, { $ref: '#/components/schemas/User' }] },
                        cancionActual: {
                            nullable: true,
                            oneOf: [objectId, { $ref: '#/components/schemas/Track' }],
                        },
                        estaReproduciendo: { type: 'boolean', example: false },
                        colaReproduccion: {
                            type: 'array',
                            items: { oneOf: [objectId, { $ref: '#/components/schemas/Track' }] },
                        },
                        usuariosActivos: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Message: {
                    type: 'object',
                    required: ['sala', 'usuario', 'contenido'],
                    properties: {
                        _id: objectId,
                        sala: { oneOf: [objectId, { $ref: '#/components/schemas/Room' }] },
                        usuario: { oneOf: [objectId, { $ref: '#/components/schemas/User' }] },
                        contenido: {
                            type: 'string',
                            maxLength: 1000,
                            example: '¡Esta canción es genial!',
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Playlist: {
                    type: 'object',
                    required: ['nombre', 'propietario'],
                    properties: {
                        _id: objectId,
                        nombre: { type: 'string', example: 'Favoritas' },
                        descripcion: { type: 'string', maxLength: 500 },
                        propietario: {
                            oneOf: [objectId, { $ref: '#/components/schemas/User' }],
                        },
                        tracks: {
                            type: 'array',
                            items: { oneOf: [objectId, { $ref: '#/components/schemas/Track' }] },
                        },
                        esPublica: { type: 'boolean', default: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        security: [{ sessionCookie: [] }],
        paths: {
            '/api/auth/google': {
                get: {
                    tags: ['Authentication'],
                    summary: 'Iniciar autenticación con Google',
                    security: [],
                    responses: {
                        302: { description: 'Redirección a la pantalla de acceso de Google' },
                    },
                },
            },
            '/api/auth/logout': {
                get: {
                    tags: ['Authentication'],
                    summary: 'Cerrar la sesión actual',
                    responses: {
                        200: {
                            description: 'Sesión cerrada',
                            content: {
                                'application/json': {
                                    example: { mensaje: 'Sesión cerrada correctamente' },
                                },
                            },
                        },
                    },
                },
            },
            '/api/auth/current-user': {
                get: {
                    tags: ['Authentication'],
                    summary: 'Consultar el usuario de la sesión',
                    security: [],
                    responses: {
                        200: {
                            description: 'Estado de autenticación',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            logueado: { type: 'boolean' },
                                            usuario: { $ref: '#/components/schemas/User' },
                                            mensaje: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/health': {
                get: {
                    tags: ['System'],
                    summary: 'Consultar estado del servicio',
                    security: [],
                    responses: {
                        200: {
                            description: 'Servicio disponible',
                            content: {
                                'application/json': {
                                    example: {
                                        status: 'ok',
                                        service: 'sonusroom-backend',
                                        timestamp: '2026-07-20T22:00:00.000Z',
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/dummy': {
                get: {
                    tags: ['System'],
                    summary: 'Obtener una respuesta de prueba',
                    security: [],
                    responses: {
                        200: {
                            description: 'Respuesta de prueba',
                            content: {
                                'application/json': {
                                    example: {
                                        message: 'Dummy endpoint',
                                        data: { foo: 'bar', version: '1.0.0' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/rooms': {
                get: {
                    tags: ['Rooms'],
                    summary: 'Listar salas',
                    responses: {
                        200: {
                            description: 'Lista de salas',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Room' },
                                    },
                                },
                            },
                        },
                        401: errorResponses.Unauthorized,
                    },
                },
                post: {
                    tags: ['Rooms'],
                    summary: 'Crear una sala',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['nombreSala'],
                                    properties: {
                                        nombreSala: { type: 'string', example: 'Sala de estudio' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Sala creada',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            mensaje: { type: 'string' },
                                            codigoAcceso: { type: 'string' },
                                            sala: { $ref: '#/components/schemas/Room' },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Nombre de sala ausente' },
                        401: errorResponses.Unauthorized,
                    },
                },
            },
            '/api/rooms/{codigo}': {
                put: {
                    tags: ['Rooms'],
                    summary: 'Actualizar el estado de una sala',
                    parameters: [
                        {
                            name: 'codigo',
                            in: 'path',
                            required: true,
                            schema: { type: 'string', example: 'ROOM-A1B2' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        cancionActual: { ...objectId, nullable: true },
                                        estaReproduciendo: { type: 'boolean' },
                                    },
                                    minProperties: 1,
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Estado actualizado' },
                        400: { description: 'Datos inválidos o ausentes' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
                delete: {
                    tags: ['Rooms'],
                    summary: 'Eliminar una sala',
                    parameters: [
                        {
                            name: 'codigo',
                            in: 'path',
                            required: true,
                            schema: { type: 'string', example: 'ROOM-A1B2' },
                        },
                    ],
                    responses: {
                        200: { description: 'Sala eliminada' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
            },
            '/api/rooms/{codigo}/queue': {
                post: {
                    tags: ['Rooms'],
                    summary: 'Añadir un track existente a la cola',
                    parameters: [
                        {
                            name: 'codigo',
                            in: 'path',
                            required: true,
                            schema: { type: 'string', example: 'ROOM-A1B2' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['trackId'],
                                    properties: { trackId: objectId },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Track añadido a la cola' },
                        400: { description: 'trackId ausente' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
            },
            '/api/rooms/{codigo}/upload': {
                post: {
                    tags: ['Rooms'],
                    summary: 'Subir audio y añadirlo a la cola',
                    parameters: [
                        {
                            name: 'codigo',
                            in: 'path',
                            required: true,
                            schema: { type: 'string', example: 'ROOM-A1B2' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['audio', 'nombreCancion'],
                                    properties: {
                                        audio: { type: 'string', format: 'binary' },
                                        nombreCancion: { type: 'string' },
                                        artista: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Audio subido a Cloudinary y añadido a la cola' },
                        400: { description: 'Archivo o nombre ausente' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
            },
            '/api/tracks': {
                get: {
                    tags: ['Tracks'],
                    summary: 'Listar tracks',
                    responses: {
                        200: {
                            description: 'Biblioteca de tracks',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Track' },
                                    },
                                },
                            },
                        },
                        401: errorResponses.Unauthorized,
                    },
                },
                post: {
                    tags: ['Tracks'],
                    summary: 'Crear un track y subir su audio a Cloudinary',
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['file', 'titulo'],
                                    properties: {
                                        file: { type: 'string', format: 'binary' },
                                        titulo: { type: 'string', example: 'Bohemian Rhapsody' },
                                        artista: { type: 'string', example: 'Queen' },
                                        duracion: { type: 'number', minimum: 0 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Track creado' },
                        400: { description: 'Título o archivo ausente' },
                        401: errorResponses.Unauthorized,
                    },
                },
            },
            '/api/tracks/{id}': {
                get: {
                    tags: ['Tracks'],
                    summary: 'Obtener un track por ID',
                    parameters: [crudIdParameter],
                    responses: {
                        200: {
                            description: 'Track encontrado',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Track' },
                                },
                            },
                        },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
                put: {
                    tags: ['Tracks'],
                    summary: 'Actualizar un track',
                    parameters: [crudIdParameter],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        titulo: { type: 'string' },
                                        artista: { type: 'string' },
                                        duracion: { type: 'number', minimum: 0 },
                                        letra: { type: 'string' },
                                    },
                                    minProperties: 1,
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Track actualizado' },
                        400: { description: 'Datos inválidos o ausentes' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
                delete: {
                    tags: ['Tracks'],
                    summary: 'Eliminar un track',
                    parameters: [crudIdParameter],
                    responses: {
                        200: { description: 'Track eliminado' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
            },
            '/api/tracks/{id}/lyrics': {
                post: {
                    tags: ['Tracks'],
                    summary: 'Obtener y guardar la letra desde Lyrics.ovh',
                    description:
                        'Consume la API REST externa Lyrics.ovh usando el artista y título del track. ' +
                        'El body puede sobrescribir esos valores para la búsqueda.',
                    parameters: [crudIdParameter],
                    requestBody: {
                        required: false,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        titulo: { type: 'string', example: 'Bohemian Rhapsody' },
                                        artista: { type: 'string', example: 'Queen' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Letra obtenida y guardada en el track' },
                        400: { description: 'El track no tiene un artista válido' },
                        401: errorResponses.Unauthorized,
                        404: { description: 'Track o letra no encontrados' },
                        502: { description: 'Lyrics.ovh no está disponible' },
                    },
                },
            },
            '/api/messages': {
                get: {
                    tags: ['Messages'],
                    summary: 'Listar mensajes',
                    parameters: [
                        {
                            name: 'salaId',
                            in: 'query',
                            required: false,
                            description: 'Filtrar mensajes por sala',
                            schema: objectId,
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Lista de mensajes',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Message' },
                                    },
                                },
                            },
                        },
                        401: errorResponses.Unauthorized,
                    },
                },
                post: {
                    tags: ['Messages'],
                    summary: 'Crear un mensaje',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['salaId', 'contenido'],
                                    properties: {
                                        salaId: objectId,
                                        contenido: {
                                            type: 'string',
                                            maxLength: 1000,
                                            example: '¡Hola a todos!',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Mensaje creado' },
                        400: { description: 'Datos requeridos ausentes' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
            },
            '/api/messages/{id}': {
                get: {
                    tags: ['Messages'],
                    summary: 'Obtener un mensaje por ID',
                    parameters: [crudIdParameter],
                    responses: {
                        200: {
                            description: 'Mensaje encontrado',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Message' },
                                },
                            },
                        },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
                put: {
                    tags: ['Messages'],
                    summary: 'Editar el contenido de un mensaje',
                    parameters: [crudIdParameter],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['contenido'],
                                    properties: {
                                        contenido: { type: 'string', maxLength: 1000 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Mensaje actualizado' },
                        400: { description: 'Contenido ausente' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
                delete: {
                    tags: ['Messages'],
                    summary: 'Eliminar un mensaje',
                    parameters: [crudIdParameter],
                    responses: {
                        200: { description: 'Mensaje eliminado' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
            },
            '/api/playlists': {
                get: {
                    tags: ['Playlists'],
                    summary: 'Listar playlists',
                    parameters: [
                        {
                            name: 'propietarioId',
                            in: 'query',
                            required: false,
                            description: 'Filtrar por propietario',
                            schema: objectId,
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Lista de playlists',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Playlist' },
                                    },
                                },
                            },
                        },
                        401: errorResponses.Unauthorized,
                    },
                },
                post: {
                    tags: ['Playlists'],
                    summary: 'Crear una playlist',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['nombre'],
                                    properties: {
                                        nombre: { type: 'string', example: 'Favoritas' },
                                        descripcion: { type: 'string', maxLength: 500 },
                                        esPublica: { type: 'boolean', default: true },
                                        tracks: { type: 'array', items: objectId },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Playlist creada' },
                        400: { description: 'Nombre ausente o track inexistente' },
                        401: errorResponses.Unauthorized,
                    },
                },
            },
            '/api/playlists/{id}': {
                get: {
                    tags: ['Playlists'],
                    summary: 'Obtener una playlist por ID',
                    parameters: [crudIdParameter],
                    responses: {
                        200: {
                            description: 'Playlist encontrada',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Playlist' },
                                },
                            },
                        },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
                put: {
                    tags: ['Playlists'],
                    summary: 'Actualizar una playlist',
                    parameters: [crudIdParameter],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nombre: { type: 'string' },
                                        descripcion: { type: 'string', maxLength: 500 },
                                        esPublica: { type: 'boolean' },
                                        tracks: { type: 'array', items: objectId },
                                    },
                                    minProperties: 1,
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Playlist actualizada' },
                        400: { description: 'Datos inválidos o ausentes' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
                delete: {
                    tags: ['Playlists'],
                    summary: 'Eliminar una playlist',
                    parameters: [crudIdParameter],
                    responses: {
                        200: { description: 'Playlist eliminada' },
                        401: errorResponses.Unauthorized,
                        404: errorResponses.NotFound,
                    },
                },
            },
        },
    },
    apis: [],
});
