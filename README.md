# SonusRoom (SoundSync)

Backend API para salas de música compartidas con sincronización en tiempo real.

**SoundSync** es una aplicación web enfocada en la reproducción y compartición de contenido de audio en tiempo real. Los usuarios pueden subir podcasts, música independiente o grabaciones personales y crear **Salas de Escucha** donde múltiples personas escuchan el mismo contenido sincronizado mientras interactúan mediante chat.

**Integrantes:** Ramiro Santos Rojas · Luis Alberto Carrillo Parra

## Tecnologías y Herramientas Utilizadas hasta el momento

* **Entorno:** Node.js
* **Lenguaje:** TypeScript
* **Framework:** Express.js 5
* **Tiempo real:** Socket.IO
* **Base de datos:** MongoDB + Mongoose
* **Auth:** Passport.js + Google OAuth 2.0 + express-session
* **Almacenamiento de audio:** Cloudinary (Multer)
* **Calidad de código:** ESLint, Prettier, Jest

---

> **Nota:** El archivo `.env` puede estar precargado en el entorno local. Usa `.env.example` como plantilla de las variables necesarias.

### Una vez clonado el repositorio

1. Copia `.env.example` a `.env` y completa los valores.
2. Ten MongoDB corriendo (local o Atlas). Ejemplo local: `mongodb://localhost:27017/sonusroom`
3. Configura Google OAuth (Client ID / Secret) y el callback `http://localhost:3000/api/auth/google/callback`
4. `npm install`
5. `npm run dev`

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (por defecto `3000`) |
| `MONGODB_URI` | URI de conexión a MongoDB (obligatoria) |
| `CLOUDINARY_CLOUD_NAME` | Nombre de la cuenta Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client secret de Google OAuth |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en desarrollo con hot-reload |
| `npm run build` | Compila TypeScript y copia `views/` a `dist/` |
| `npm run start` | Ejecuta el build en producción |
| `npm run test` | Ejecuta los tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run lint` | Revisa el código con ESLint |
| `npm run lint:fix` | Corrige errores de ESLint automáticamente |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica el formato sin modificar archivos |
| `npm run check` | Ejecuta lint, format:check y test |

## Arranque

**Desarrollo:**

```bash
npm run dev
```

**Producción:**

```bash
npm run build
npm run start
```

El servidor queda en `http://localhost:3000` (o el puerto de `PORT`).

El dashboard de prueba se sirve en `/` (`src/views/`).

## Autenticación

Las mutaciones de salas/tracks y **todas** las conexiones Socket.IO requieren sesión de Google.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/auth/google` | Inicia OAuth con Google |
| `GET` | `/api/auth/google/callback` | Callback; éxito → `/`, fallo → `/login-error` |
| `GET` | `/api/auth/logout` | Cierra la sesión |
| `GET` | `/api/auth/current-user` | Indica si hay sesión (`logueado`, `usuario`) |

Flujo típico: abrir `/api/auth/google` en el navegador → iniciar sesión → cookies de sesión habilitadas en peticiones al API y en Socket.IO.

Las rutas marcadas con **Auth** usan el middleware `isAuthorized` (responden `401` si no hay sesión).

## Endpoints

### Dummy

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Estado del servicio |
| `GET` | `/api/dummy` | No | Respuesta de prueba |

### Salas (`/api/rooms`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/rooms` | Sí | Listar salas |
| `POST` | `/api/rooms` | Sí | Crear sala (`{ "nombreSala": "..." }`) → genera `codigoAcceso` tipo `ROOM-XXXX` |
| `PUT` | `/api/rooms/:codigo` | Sí | Actualizar `cancionActual` y/o `estaReproduciendo` |
| `DELETE` | `/api/rooms/:codigo` | Sí | Eliminar sala |
| `POST` | `/api/rooms/:codigo/upload` | Sí | Subir audio (multipart campo `audio`) + crear track + meterlo en cola. Body: `nombreCancion` (requerido), `artista` |
| `POST` | `/api/rooms/:codigo/queue` | Sí | Añadir un track existente a la cola (`{ "trackId": "..." }`) |

### Tracks (`/api/tracks`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/tracks` | Sí | Listar tracks |
| `GET` | `/api/tracks/:id` | Sí | Obtener track por ID |
| `POST` | `/api/tracks` | Sí | Crear track (multipart campo `file`). Body: `titulo` (requerido), `artista`, `duracion` |
| `PUT` | `/api/tracks/:id` | Sí | Actualizar `titulo`, `artista`, `duracion`, `letra` |
| `DELETE` | `/api/tracks/:id` | Sí | Eliminar track |

### Dashboard (UI de prueba)

En `http://localhost:3000/` puedes:

1. Iniciar sesión con Google
2. Crear / unirte a una sala
3. Gestionar la **biblioteca de canciones** (crear, editar, borrar)
4. Usar **A la fila** para meter un track existente en la cola de la sala conectada
5. Reproducir / pausar / siguiente con sincronización vía Socket.IO

## Socket.IO

Las conexiones requieren la misma sesión de Google. Sin login, el socket se rechaza.

### Cliente → servidor

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `join-room` | `roomCode` | Une al socket a la sala |
| `player-action` | `{ roomCode, action, currentTime, trackId? }` | Play/pause sincronizado |
| `cola-actualizada` | `{ codigoAcceso, colaReproduccion }` | Notifica cambios de cola a otros clientes |
| `next-track` | `{ roomCode }` | Pasa a la siguiente canción de la cola |

### Servidor → cliente

| Evento | Descripción |
|--------|-------------|
| `room-sync-init` | Estado inicial al unirse (`urlAudio`, `estaReproduciendo`, `currentTime`) |
| `player-broadcast` | Difusión de play/pause / cambio de track |
| `actualizar-cola-broadcast` | Cola actualizada |

## Estructura del proyecto

```
src/
├── app.ts                 # Entrada: MongoDB, HTTP, Socket.IO
├── createApp.ts           # Express, sesión, Passport, rutas
├── config/
│   ├── cloudinary.ts      # Multer + Cloudinary
│   └── passport.ts        # Google OAuth strategy
├── controllers/           # Lógica de rooms, tracks, dummy
├── middlewares/           # isAuthorized
├── models/                # User, Track, Room (Mongoose)
├── routes/                # auth, rooms, tracks, dummy
├── sockets/               # audioSocket (sync + cola)
├── views/                 # Dashboard HTML/JS de prueba
└── __tests__/             # Jest + Supertest
```

## Base de datos

Persistencia en **MongoDB** (local o Atlas) con **Mongoose**.

```mermaid
erDiagram
    USER ||--o{ TRACK : "sube (subidoPor)"
    USER ||--o{ ROOM : "hospeda (host)"
    USER ||--o{ MESSAGE : "envía (planificado)"
    ROOM ||--o| TRACK : "reproduce (cancionActual)"
    ROOM }o--o{ TRACK : "cola (colaReproduccion)"
    ROOM ||--o{ MESSAGE : "contiene (planificado)"

    USER {
        ObjectId _id PK
        string googleId UK
        string nombre
        string email UK
        string avatar
        date createdAt
    }

    TRACK {
        ObjectId _id PK
        string titulo
        string artista
        string urlAudio "Cloudinary"
        number duracion
        string letra
        ObjectId subidoPor FK
        date createdAt
        date updatedAt
    }

    ROOM {
        ObjectId _id PK
        string nombreSala
        string codigoAcceso UK
        ObjectId host FK
        ObjectId[] colaReproduccion FK
        ObjectId cancionActual FK
        boolean estaReproduciendo
        string[] usuariosActivos
        date createdAt
        date updatedAt
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId sala FK "planificado"
        ObjectId usuario FK "planificado"
        string contenido "planificado"
        date createdAt "planificado"
    }
```

### Colecciones

| Colección | Descripción | Estado |
|-----------|-------------|--------|
| **User** | Usuario autenticado con Google (`googleId`, `email`, `avatar`) | Implementado |
| **Track** | Audio en Cloudinary + metadata | Implementado |
| **Room** | Sala con `colaReproduccion`, `cancionActual` y sync en vivo | Implementado |
| **Message** | Chat en sala | Planificado |

### Servicios externos

| Servicio | Uso |
|----------|-----|
| **Cloudinary** | Archivo de audio; URL en `Track.urlAudio` |
| **Google OAuth** | Identidad; `User.googleId` |
| **Socket.IO** | Sync de reproducción y cola |

## Tests

```bash
npm run test
```

Los endpoints dummy (`/api/health`, `/api/dummy`) tienen cobertura con Jest y Supertest.

El marco de trabajo implementado al momento:

<img width="763" height="882" alt="image" src="https://github.com/user-attachments/assets/93050ace-c670-49a4-8cf3-fdbad450015f" />
