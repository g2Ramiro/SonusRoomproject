
document.addEventListener('DOMContentLoaded', () => {

    //Inicializacion de variables y elementos del DOM
    const socket = io(); 
    const audioPlayer = document.getElementById('audioPlayer');
    const roomInput = document.getElementById('roomInput');
    const btnJoin = document.getElementById('btnJoin');
    const formSubir = document.getElementById('form-subir-audio');
    const estadoSubida = document.getElementById('estado-subida');
    const listaCola = document.getElementById('lista-cola');
    const btnNext = document.getElementById('btnNext');
    
    // Elementos para crear y borrar salas
    const newRoomNameInput = document.getElementById('newRoomNameInput');
    const btnCreateRoom = document.getElementById('btnCreateRoom');
    const btnDeleteRoom = document.getElementById('btnDeleteRoom');
    const dangerZone = document.getElementById('danger-zone');

    let currentRoom = "";
    let isBroadcasting = false;

    //Unirse a una sala existente usando el código de acceso
    if (btnJoin && roomInput) {
        btnJoin.addEventListener('click', () => {
            currentRoom = roomInput.value.trim().toUpperCase(); 
            if (!currentRoom) return alert("Por favor ingresa un código de sala válido.");

            socket.emit('join-room', currentRoom);
            alert(`Conectado a la sala: ${currentRoom}`);
        
            if (dangerZone) dangerZone.style.display = 'block';
        });
    }
    // Crear una nueva sala y obtener un código de acceso
    if (btnCreateRoom && newRoomNameInput) {
        btnCreateRoom.addEventListener('click', async () => {
            const nombreSala = newRoomNameInput.value.trim();
            if (!nombreSala) return alert("Por favor, escribe un nombre para tu sala.");

            try {
                btnCreateRoom.disabled = true;
                
                // Petición HTTP POST al backend para crear el registro
                const response = await fetch('/api/rooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombreSala })
                });

                const data = await response.json();

                if (response.ok) {
                    const codigoGenerado = data.codigoAcceso || (data.room && data.room.codigoAcceso);
                    
                    alert(`¡Sala creada con éxito! 🎉\nCódigo de acceso: ${codigoGenerado}`);
                    
                    // Colocamos el código en el input de unirse automáticamente
                    if (roomInput) roomInput.value = codigoGenerado;
                    newRoomNameInput.value = "";
                } else {
                    alert(`Error al crear sala: ${data.mensaje || data.error || 'Inténtalo de nuevo'}`);
                }
            } catch (err) {
                console.error(err);
                alert("Error de red al intentar crear la sala.");
            } finally {
                btnCreateRoom.disabled = false;
            }
        });
    }

    // Borrar la sala actual (solo si estás conectado a una)
    if (btnDeleteRoom) {
        btnDeleteRoom.addEventListener('click', async () => {
            if (!currentRoom) return alert("No estás conectado a ninguna sala activa.");
            
            const confirmar = confirm(`¿Estás seguro de que deseas borrar la sala ${currentRoom}?\nEsto sacará a todos los usuarios.`);
            if (!confirmar) return;

            try {
                btnDeleteRoom.disabled = true;

                // Petición HTTP DELETE al backend usando el código de acceso
                const response = await fetch(`/api/rooms/${currentRoom}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Sala eliminada correctamente");
                    
                    // Limpiamos los estados locales y reseteamos el reproductor
                    currentRoom = "";
                    if (roomInput) roomInput.value = "";
                    if (audioPlayer) {
                        audioPlayer.pause();
                        audioPlayer.src = "";
                    }
                    if (dangerZone) dangerZone.style.display = 'none';
                    
                    actualizarInterfazCola([]); // Vaciamos la lista en pantalla
                } else {
                    alert(`No se pudo borrar la sala: ${data.mensaje || data.error}`);
                }
            } catch (err) {
                console.error(err);
                alert("Error de comunicación al intentar destruir la sala.");
            } finally {
                btnDeleteRoom.disabled = false;
            }
        });
    }

    //escuchar eventos de play/pause del reproductor y emitirlos a los sockets
    if (audioPlayer) {
        audioPlayer.addEventListener('play', () => {
            if (isBroadcasting) return; 
            socket.emit('player-action', {
                roomCode: currentRoom,
                action: 'play',
                currentTime: audioPlayer.currentTime
            });
        });

        audioPlayer.addEventListener('pause', () => {
            if (isBroadcasting) return; 
            socket.emit('player-action', {
                roomCode: currentRoom,
                action: 'pause',
                currentTime: audioPlayer.currentTime
            });
        });
    }

    
    // Sincronización inicial al entrar a una sala en curso
    socket.on('room-sync-init', (data) => {
        console.log("Sincronización inicial recibida:", data);
        if (audioPlayer && data.urlAudio && audioPlayer.src !== data.urlAudio) {
            isBroadcasting = true;
            audioPlayer.src = data.urlAudio; 
            audioPlayer.currentTime = data.currentTime;

            if (data.estaReproduciendo) {
                audioPlayer.play().catch(() => console.log("Autoplay retenido por el navegador."));
            }
            isBroadcasting = false;
        }
    });

    //
    socket.on('player-broadcast', (data) => {
        const { action, currentTime, urlAudio } = data;
        if (!audioPlayer) return;

        isBroadcasting = true;

        if (urlAudio && audioPlayer.src !== urlAudio) {
            audioPlayer.src = urlAudio;
        }

        audioPlayer.currentTime = currentTime;

        if (action === 'play') {
            audioPlayer.play().catch(() => console.log("Esperando click de interacción remota."));
        } else if (action === 'pause') {
            audioPlayer.pause();
        }

        isBroadcasting = false;
    });

    // Escuchar actualizaciones de la cola hechas por otros miembros
    socket.on('actualizar-cola-broadcast', (data) => {
        console.log("Cola actualizada via broadcast:", data);
        const colaRecibida = data.colaReproduccion || data.colaActual;
        actualizarInterfazCola(colaRecibida);
    });

    //Subir un archivo de audio a la sala actual
    if (formSubir) {
        formSubir.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentRoom) {
                alert("Primero debes conectarte a una sala usando el botón correspondiente.");
                return;
            }

            const fileInput = document.getElementById('archivo-audio');
            const nombreCancionInput = document.getElementById('nombreCancion');
            const artistaInput = document.getElementById('artista');

            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                alert("Por favor, selecciona un archivo .mp3.");
                return;
            }

            const formData = new FormData();
            formData.append('audio', fileInput.files[0]);
            formData.append('nombreCancion', nombreCancionInput ? nombreCancionInput.value : "");
            formData.append('artista', artistaInput ? artistaInput.value : "");

            if (estadoSubida) estadoSubida.innerText = "Subiendo archivo a la nube... 🚀";

            try {
                const response = await fetch(`/api/rooms/${currentRoom}/upload`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    if (estadoSubida) estadoSubida.innerText = "¡Añadida con éxito! ✨";
                    formSubir.reset(); 

                    const nuevaCola = data.colaActual || data.colaReproduccion;
                    actualizarInterfazCola(nuevaCola);

                    // Avisamos al resto de las pestañas por sockets
                    socket.emit('cola-actualizada', {
                        codigoAcceso: currentRoom,
                        colaReproduccion: nuevaCola
                    });
                } else {
                    if (estadoSubida) estadoSubida.innerText = `Error: ${data.error || 'No se pudo subir'}`;
                }
            } catch (err) {
                console.error(err);
                if (estadoSubida) estadoSubida.innerText = "Error en la conexión de red.";
            }
        });
    }

    // Botón Siguiente Automático al terminar la canción
    if (audioPlayer) {
        audioPlayer.addEventListener('ended', () => {
            if (isBroadcasting) return; 
            console.log("Track finalizado. Saltando automáticamente...");
            socket.emit('next-track', { roomCode: currentRoom });
        });
    }

    // Botón Siguiente Manual
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (!currentRoom) return alert("No estás en ninguna sala.");
            
            btnNext.disabled = true;
            console.log("Saltando de canción manualmente...");
            
            socket.emit('next-track', { roomCode: currentRoom });

            setTimeout(() => {
                btnNext.disabled = false;
            }, 1500);
        });
    }

    // Función para actualizar la interfaz de la cola de reproducción
    function actualizarInterfazCola(cola) {
        if (!listaCola) return;

        listaCola.innerHTML = ''; 

        if (!cola || cola.length === 0) {
            listaCola.innerHTML = '<li>No hay canciones en la cola</li>';
            return;
        }

        cola.forEach((track) => {
            const li = document.createElement('li');
            
            // Si viene poblado por Mongoose (.populate) es un objeto, sino es el ID string plano
            if (typeof track === 'object' && track !== null) {
                const tituloMostrar = track.nombreTrack || track.nombreCancion || track.titulo || "Canción sin título";
                const artistaMostrar = track.artistaTrack || track.artista || "Artista Desconocido";
                
                li.innerText = `${tituloMostrar} - ${artistaMostrar}`;
            } else {
                li.innerText = `ID Canción en cola: ${track}`;
            }
            listaCola.appendChild(li);
        });
    }

}); 