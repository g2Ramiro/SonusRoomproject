# SonusRoom

## Tecnologías y Herramientas Utilizadas hasta el momento

* **Entorno de Ejecución:** Node.js 
* **Lenguaje:** TypeScript
* **Framework Web:** Express.js
* **Tiempo Real (WebSockets):** Socket.io
* **Base de Datos:** MongoDB
* **Almacenamiento en la Nube:** Cloudinary

---
> **Nota:** El archivo `.env` ya se encuentra precargado y guardado en el repositorio con las credenciales activas de Cloudinary.

### Una vez clonado el repositorio hacer lo siguiente:
### 🍃 Configuración de la Base de Datos Local (MongoDB)

Para que el servidor pueda guardar las canciones y las salas se necesita una instancia local de MongoDB corriendo, en .env coloca tu propia url por defecto para conectarte, como en mi caso fue: `mongodb://localhost:27017`
Una vez teniendo mongo:
Correr npm install para instalar las dependencias del package.json
npm run dev para levantar el servidor local
Con PostMan:
Envía una petición **POST** a `http://localhost:3000/api/rooms` con el siguiente cuerpo en formato JSON:
  ```json
  {
    "nombreSala": "Nombre de sala"
  }
Una vez hecha la petición se responderá con un 201 created y se generará un código de acceso aleatorio como ROOM-6WF9, si se quieren ver las salas activas se puede usar la ruta http://localhost:3000/api/rooms

Para probar: ya levantado el servidor local e ingresando a localhost:3000 se ingresa la sala creada en dos pestañas diferentes y se conecta, se reproduce y pausa el audio para comprobar funcionamiento.