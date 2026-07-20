document.addEventListener('DOMContentLoaded', () => {

    // Inicializacion de variables y elementos del DOM
    const socket = io();
    const audioPlayer = document.getElementById('audioPlayer');
    const roomInput = document.getElementById('roomInput');
    const btnJoin = document.getElementById('btnJoin');
    const listaCola = document.getElementById('lista-cola');
    const btnNext = document.getElementById('btnNext');

    // Elementos para crear y borrar salas
    const newRoomNameInput = document.getElementById('newRoomNameInput');
    const btnCreateRoom = document.getElementById('btnCreateRoom');
    const btnDeleteRoom = document.getElementById('btnDeleteRoom');
    const dangerZone = document.getElementById('danger-zone');

    // Elementos de biblioteca de tracks
    const formCrearTrack = document.getElementById('form-crear-track');
    const estadoTrack = document.getElementById('estado-track');
    const listaTracks = document.getElementById('lista-tracks');
    const btnRefreshTracks = document.getElementById('btnRefreshTracks');
    const formEditarTrack = document.getElementById('form-editar-track');
    const editTrackId = document.getElementById('editTrackId');
    const editTrackTitulo = document.getElementById('editTrackTitulo');
    const editTrackArtista = document.getElementById('editTrackArtista');
    const btnGuardarTrack = document.getElementById('btnGuardarTrack');
    const btnCancelarEdit = document.getElementById('btnCancelarEdit');

    // Chat
    const listaMensajes = document.getElementById('lista-mensajes');
    const formEnviarMensaje = document.getElementById('form-enviar-mensaje');
    const mensajeContenido = document.getElementById('mensajeContenido');
    const btnRefreshMensajes = document.getElementById('btnRefreshMensajes');
    const estadoChat = document.getElementById('estado-chat');
    const formEditarMensaje = document.getElementById('form-editar-mensaje');
    const editMensajeId = document.getElementById('editMensajeId');
    const editMensajeContenido = document.getElementById('editMensajeContenido');
    const btnGuardarMensaje = document.getElementById('btnGuardarMensaje');
    const btnCancelarEditMensaje = document.getElementById('btnCancelarEditMensaje');

    // Playlists
    const formCrearPlaylist = document.getElementById('form-crear-playlist');
    const playlistNombre = document.getElementById('playlistNombre');
    const playlistDescripcion = document.getElementById('playlistDescripcion');
    const estadoPlaylist = document.getElementById('estado-playlist');
    const listaPlaylists = document.getElementById('lista-playlists');
    const btnRefreshPlaylists = document.getElementById('btnRefreshPlaylists');
    const formEditarPlaylist = document.getElementById('form-editar-playlist');
    const editPlaylistId = document.getElementById('editPlaylistId');
    const editPlaylistNombre = document.getElementById('editPlaylistNombre');
    const editPlaylistDescripcion = document.getElementById('editPlaylistDescripcion');
    const editPlaylistTrackSelect = document.getElementById('editPlaylistTrackSelect');
    const btnGuardarPlaylist = document.getElementById('btnGuardarPlaylist');
    const btnCancelarEditPlaylist = document.getElementById('btnCancelarEditPlaylist');

    let currentRoom = "";
    let currentRoomId = "";
    let isBroadcasting = false;
    let tracksCache = [];
    let playlistTracksCache = [];

    async function resolverSalaId(codigoAcceso) {
        const response = await fetch('/api/rooms', { credentials: 'include' });
        const rooms = await response.json();
        if (!response.ok || !Array.isArray(rooms)) {
            throw new Error('No se pudieron listar las salas');
        }
        const sala = rooms.find((r) => String(r.codigoAcceso).toUpperCase() === codigoAcceso);
        return sala ? sala._id : null;
    }

    // Unirse a una sala existente usando el código de acceso
    if (btnJoin && roomInput) {
        btnJoin.addEventListener('click', async () => {
            currentRoom = roomInput.value.trim().toUpperCase();
            if (!currentRoom) return alert("Por favor ingresa un código de sala válido.");

            try {
                currentRoomId = await resolverSalaId(currentRoom);
                if (!currentRoomId) {
                    alert(`No se encontró la sala ${currentRoom}. Verifica el código.`);
                    currentRoom = "";
                    return;
                }

                socket.emit('join-room', currentRoom);
                alert(`Conectado a la sala: ${currentRoom}`);

                if (dangerZone) dangerZone.style.display = 'block';
                if (estadoChat) estadoChat.innerText = `Chat activo en ${currentRoom}`;
                cargarMensajes();
            } catch (err) {
                console.error(err);
                alert("Error al resolver la sala. Intenta de nuevo.");
                currentRoom = "";
                currentRoomId = "";
            }
        });
    }

    // Crear una nueva sala y obtener un código de acceso
    if (btnCreateRoom && newRoomNameInput) {
        btnCreateRoom.addEventListener('click', async () => {
            const nombreSala = newRoomNameInput.value.trim();
            if (!nombreSala) return alert("Por favor, escribe un nombre para tu sala.");

            try {
                btnCreateRoom.disabled = true;

                // Petición HTTP POST al backend con credenciales incluidas
                const response = await fetch('/api/rooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombreSala }),
                    credentials: 'include'
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

                // Petición HTTP DELETE al backend incluyendo cookies de sesión
                const response = await fetch(`/api/rooms/${currentRoom}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Sala eliminada correctamente");

                    // Limpiamos los estados locales y reseteamos el reproductor
                    currentRoom = "";
                    currentRoomId = "";
                    if (roomInput) roomInput.value = "";
                    if (audioPlayer) {
                        audioPlayer.pause();
                        audioPlayer.src = "";
                    }
                    if (dangerZone) dangerZone.style.display = 'none';
                    if (estadoChat) estadoChat.innerText = '';
                    if (listaMensajes) listaMensajes.innerHTML = '<li>Sin sala conectada.</li>';

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

    // Escuchar eventos de play/pause del reproductor y emitirlos a los sockets
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

    // Broadcast del reproductor
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

    // Biblioteca de tracks (/api/tracks)
    async function cargarTracks() {
        if (!listaTracks) return;

        try {
            const response = await fetch('/api/tracks', { credentials: 'include' });
            const tracks = await response.json();

            if (!response.ok) {
                listaTracks.innerHTML = `<li>Error: ${tracks.error || 'No se pudieron cargar'}</li>`;
                return;
            }

            listaTracks.innerHTML = '';

            if (!Array.isArray(tracks) || tracks.length === 0) {
                tracksCache = [];
                llenarSelectTracks();
                listaTracks.innerHTML = '<li>No hay canciones registradas todavía.</li>';
                return;
            }

            tracksCache = tracks;
            llenarSelectTracks();

            tracks.forEach((track) => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                li.style.gap = '8px';

                const info = document.createElement('span');
                info.textContent = `${track.titulo} - ${track.artista || 'Artista Desconocido'}`;

                const actions = document.createElement('span');
                actions.style.display = 'flex';
                actions.style.gap = '6px';
                actions.style.flexShrink = '0';

                const btnQueue = document.createElement('button');
                btnQueue.type = 'button';
                btnQueue.textContent = 'A la fila';
                btnQueue.style.backgroundColor = '#1DB954';
                btnQueue.style.padding = '6px 10px';
                btnQueue.style.fontSize = '12px';
                btnQueue.addEventListener('click', () => agregarTrackACola(track._id, track.titulo));

                const btnEdit = document.createElement('button');
                btnEdit.type = 'button';
                btnEdit.textContent = 'Editar';
                btnEdit.style.backgroundColor = '#007bff';
                btnEdit.style.padding = '6px 10px';
                btnEdit.style.fontSize = '12px';
                btnEdit.addEventListener('click', () => abrirEdicionTrack(track));

                const btnDelete = document.createElement('button');
                btnDelete.type = 'button';
                btnDelete.textContent = 'Borrar';
                btnDelete.style.backgroundColor = '#dc3545';
                btnDelete.style.padding = '6px 10px';
                btnDelete.style.fontSize = '12px';
                btnDelete.addEventListener('click', () => eliminarTrack(track._id, track.titulo));

                actions.appendChild(btnQueue);
                actions.appendChild(btnEdit);
                actions.appendChild(btnDelete);
                li.appendChild(info);
                li.appendChild(actions);
                listaTracks.appendChild(li);
            });
        } catch (err) {
            console.error(err);
            listaTracks.innerHTML = '<li>Error de red al cargar canciones.</li>';
        }
    }

    function abrirEdicionTrack(track) {
        if (!formEditarTrack || !editTrackId || !editTrackTitulo || !editTrackArtista) return;
        editTrackId.value = track._id;
        editTrackTitulo.value = track.titulo || '';
        editTrackArtista.value = track.artista || '';
        formEditarTrack.style.display = 'block';
        editTrackTitulo.focus();
    }

    function cerrarEdicionTrack() {
        if (!formEditarTrack) return;
        formEditarTrack.style.display = 'none';
        if (editTrackId) editTrackId.value = '';
        if (editTrackTitulo) editTrackTitulo.value = '';
        if (editTrackArtista) editTrackArtista.value = '';
    }

    async function eliminarTrack(id, titulo) {
        const confirmar = confirm(`¿Eliminar la canción "${titulo}"?`);
        if (!confirmar) return;

        try {
            const response = await fetch(`/api/tracks/${id}`, { 
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                if (estadoTrack) estadoTrack.innerText = 'Canción eliminada.';
                if (editTrackId && editTrackId.value === id) cerrarEdicionTrack();
                cargarTracks();
            } else {
                alert(data.error || data.mensaje || 'No se pudo eliminar');
            }
        } catch (err) {
            console.error(err);
            alert('Error de red al eliminar la canción.');
        }
    }

    async function agregarTrackACola(trackId, titulo) {
        if (!currentRoom) {
            alert('Primero conéctate a una sala para añadir canciones a la fila.');
            return;
        }

        try {
            const response = await fetch(`/api/rooms/${currentRoom}/queue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId }),
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                if (estadoTrack) estadoTrack.innerText = `"${titulo}" añadida a la fila de ${currentRoom}.`;

                const nuevaCola = data.colaActual || data.colaReproduccion;
                actualizarInterfazCola(nuevaCola);

                socket.emit('cola-actualizada', {
                    codigoAcceso: currentRoom,
                    colaReproduccion: nuevaCola
                });
            } else {
                alert(data.error || data.mensaje || 'No se pudo añadir a la fila');
            }
        } catch (err) {
            console.error(err);
            alert('Error de red al añadir la canción a la fila.');
        }
    }

    if (formCrearTrack) {
        formCrearTrack.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tituloInput = document.getElementById('trackTitulo');
            const artistaInput = document.getElementById('trackArtista');
            const fileInput = document.getElementById('trackFile');

            const titulo = tituloInput ? tituloInput.value.trim() : '';
            const artista = artistaInput ? artistaInput.value.trim() : '';

            if (!titulo) {
                alert('El título de la canción es requerido.');
                return;
            }

            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                alert('Selecciona un archivo .mp3.');
                return;
            }

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('titulo', titulo);
            formData.append('artista', artista);

            if (estadoTrack) estadoTrack.innerText = 'Creando track...';

            try {
                const response = await fetch('/api/tracks', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                const data = await response.json();

                if (response.ok) {
                    if (estadoTrack) estadoTrack.innerText = 'Track creado con éxito.';
                    formCrearTrack.reset();
                    cargarTracks();
                } else {
                    if (estadoTrack) estadoTrack.innerText = `Error: ${data.error || data.mensaje || 'No se pudo crear'}`;
                }
            } catch (err) {
                console.error(err);
                if (estadoTrack) estadoTrack.innerText = 'Error de red al crear el track.';
            }
        });
    }

    if (btnGuardarTrack) {
        btnGuardarTrack.addEventListener('click', async () => {
            const id = editTrackId ? editTrackId.value : '';
            const titulo = editTrackTitulo ? editTrackTitulo.value.trim() : '';
            const artista = editTrackArtista ? editTrackArtista.value.trim() : '';

            if (!id) return alert('No hay canción seleccionada para editar.');
            if (!titulo) return alert('El título no puede estar vacío.');

            try {
                btnGuardarTrack.disabled = true;
                const response = await fetch(`/api/tracks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ titulo, artista }),
                    credentials: 'include'
                });
                const data = await response.json();

                if (response.ok) {
                    if (estadoTrack) estadoTrack.innerText = 'Canción actualizada.';
                    cerrarEdicionTrack();
                    cargarTracks();
                } else {
                    alert(data.error || data.mensaje || 'No se pudo actualizar');
                }
            } catch (err) {
                console.error(err);
                alert('Error de red al actualizar la canción.');
            } finally {
                btnGuardarTrack.disabled = false;
            }
        });
    }

    if (btnCancelarEdit) {
        btnCancelarEdit.addEventListener('click', cerrarEdicionTrack);
    }

    if (btnRefreshTracks) {
        btnRefreshTracks.addEventListener('click', cargarTracks);
    }

    function llenarSelectTracks(selectedIds) {
        if (!editPlaylistTrackSelect) return;
        const keep = selectedIds || [];
        editPlaylistTrackSelect.innerHTML = '<option value="">— Ninguno (no agregar) —</option>';
        tracksCache.forEach((track) => {
            const option = document.createElement('option');
            option.value = track._id;
            option.textContent = track.titulo + ' - ' + (track.artista || 'Artista Desconocido');
            if (keep.includes(track._id)) option.disabled = true;
            editPlaylistTrackSelect.appendChild(option);
        });
    }

    // --- Chat (/api/messages) ---
    async function cargarMensajes() {
        if (!listaMensajes) return;

        if (!currentRoomId) {
            listaMensajes.innerHTML = '<li>Sin sala conectada.</li>';
            return;
        }

        try {
            const response = await fetch('/api/messages?salaId=' + encodeURIComponent(currentRoomId), {
                credentials: 'include',
            });
            const messages = await response.json();

            if (!response.ok) {
                listaMensajes.innerHTML = '<li>Error: ' + (messages.error || 'No se pudieron cargar') + '</li>';
                return;
            }

            listaMensajes.innerHTML = '';

            if (!Array.isArray(messages) || messages.length === 0) {
                listaMensajes.innerHTML = '<li>No hay mensajes en esta sala todavía.</li>';
                return;
            }

            messages.forEach((msg) => {
                const li = document.createElement('li');

                const info = document.createElement('span');
                const autor = (msg.usuario && msg.usuario.nombre) || 'Usuario';
                info.textContent = autor + ': ' + msg.contenido;

                const actions = document.createElement('span');
                actions.style.display = 'flex';
                actions.style.gap = '6px';
                actions.style.flexShrink = '0';

                const btnEdit = document.createElement('button');
                btnEdit.type = 'button';
                btnEdit.textContent = 'Editar';
                btnEdit.className = 'btn-sm';
                btnEdit.style.backgroundColor = '#007bff';
                btnEdit.addEventListener('click', () => abrirEdicionMensaje(msg));

                const btnDelete = document.createElement('button');
                btnDelete.type = 'button';
                btnDelete.textContent = 'Borrar';
                btnDelete.className = 'btn-sm';
                btnDelete.style.backgroundColor = '#dc3545';
                btnDelete.addEventListener('click', () => eliminarMensaje(msg._id));

                actions.appendChild(btnEdit);
                actions.appendChild(btnDelete);
                li.appendChild(info);
                li.appendChild(actions);
                listaMensajes.appendChild(li);
            });
        } catch (err) {
            console.error(err);
            listaMensajes.innerHTML = '<li>Error de red al cargar mensajes.</li>';
        }
    }

    function abrirEdicionMensaje(msg) {
        if (!formEditarMensaje || !editMensajeId || !editMensajeContenido) return;
        editMensajeId.value = msg._id;
        editMensajeContenido.value = msg.contenido || '';
        formEditarMensaje.style.display = 'block';
        editMensajeContenido.focus();
    }

    function cerrarEdicionMensaje() {
        if (!formEditarMensaje) return;
        formEditarMensaje.style.display = 'none';
        if (editMensajeId) editMensajeId.value = '';
        if (editMensajeContenido) editMensajeContenido.value = '';
    }

    async function eliminarMensaje(id) {
        if (!confirm('¿Eliminar este mensaje?')) return;

        try {
            const response = await fetch('/api/messages/' + id, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                if (estadoChat) estadoChat.innerText = 'Mensaje eliminado.';
                if (editMensajeId && editMensajeId.value === id) cerrarEdicionMensaje();
                cargarMensajes();
            } else {
                alert(data.error || data.mensaje || 'No se pudo eliminar');
            }
        } catch (err) {
            console.error(err);
            alert('Error de red al eliminar el mensaje.');
        }
    }

    if (formEnviarMensaje) {
        formEnviarMensaje.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentRoomId) {
                alert('Primero conéctate a una sala para enviar mensajes.');
                return;
            }

            const contenido = mensajeContenido ? mensajeContenido.value.trim() : '';
            if (!contenido) return alert('Escribe un mensaje.');

            try {
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ salaId: currentRoomId, contenido }),
                    credentials: 'include',
                });
                const data = await response.json();

                if (response.ok) {
                    if (mensajeContenido) mensajeContenido.value = '';
                    if (estadoChat) estadoChat.innerText = 'Mensaje enviado.';
                    cargarMensajes();
                } else {
                    alert(data.error || data.mensaje || 'No se pudo enviar');
                }
            } catch (err) {
                console.error(err);
                alert('Error de red al enviar el mensaje.');
            }
        });
    }

    if (btnGuardarMensaje) {
        btnGuardarMensaje.addEventListener('click', async () => {
            const id = editMensajeId ? editMensajeId.value : '';
            const contenido = editMensajeContenido ? editMensajeContenido.value.trim() : '';

            if (!id) return alert('No hay mensaje seleccionado.');
            if (!contenido) return alert('El contenido no puede estar vacío.');

            try {
                btnGuardarMensaje.disabled = true;
                const response = await fetch('/api/messages/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contenido }),
                    credentials: 'include',
                });
                const data = await response.json();

                if (response.ok) {
                    if (estadoChat) estadoChat.innerText = 'Mensaje actualizado.';
                    cerrarEdicionMensaje();
                    cargarMensajes();
                } else {
                    alert(data.error || data.mensaje || 'No se pudo actualizar');
                }
            } catch (err) {
                console.error(err);
                alert('Error de red al actualizar el mensaje.');
            } finally {
                btnGuardarMensaje.disabled = false;
            }
        });
    }

    if (btnCancelarEditMensaje) {
        btnCancelarEditMensaje.addEventListener('click', cerrarEdicionMensaje);
    }

    if (btnRefreshMensajes) {
        btnRefreshMensajes.addEventListener('click', cargarMensajes);
    }

    // --- Playlists (/api/playlists) ---
    async function cargarPlaylists() {
        if (!listaPlaylists) return;

        try {
            const response = await fetch('/api/playlists', { credentials: 'include' });
            const playlists = await response.json();

            if (!response.ok) {
                listaPlaylists.innerHTML = '<li>Error: ' + (playlists.error || 'No se pudieron cargar') + '</li>';
                return;
            }

            listaPlaylists.innerHTML = '';

            if (!Array.isArray(playlists) || playlists.length === 0) {
                listaPlaylists.innerHTML = '<li>No hay playlists todavía.</li>';
                return;
            }

            playlists.forEach((playlist) => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'flex-start';
                li.style.gap = '8px';
                li.style.flexDirection = 'column';

                const trackTitles = Array.isArray(playlist.tracks) && playlist.tracks.length
                    ? playlist.tracks.map((t) => (typeof t === 'object' ? t.titulo : t)).join(', ')
                    : 'sin tracks';

                const info = document.createElement('span');
                info.innerHTML = '<strong>' + playlist.nombre + '</strong> — ' +
                    (playlist.descripcion || 'Sin descripción') + '<br>' +
                    '<span class="muted">' + (playlist.tracks ? playlist.tracks.length : 0) +
                    ' track(s): ' + trackTitles + '</span>';

                const actions = document.createElement('span');
                actions.style.display = 'flex';
                actions.style.gap = '6px';

                const btnEdit = document.createElement('button');
                btnEdit.type = 'button';
                btnEdit.textContent = 'Editar';
                btnEdit.className = 'btn-sm';
                btnEdit.style.backgroundColor = '#007bff';
                btnEdit.addEventListener('click', () => abrirEdicionPlaylist(playlist));

                const btnDelete = document.createElement('button');
                btnDelete.type = 'button';
                btnDelete.textContent = 'Borrar';
                btnDelete.className = 'btn-sm';
                btnDelete.style.backgroundColor = '#dc3545';
                btnDelete.addEventListener('click', () => eliminarPlaylist(playlist._id, playlist.nombre));

                actions.appendChild(btnEdit);
                actions.appendChild(btnDelete);
                li.appendChild(info);
                li.appendChild(actions);
                listaPlaylists.appendChild(li);
            });
        } catch (err) {
            console.error(err);
            listaPlaylists.innerHTML = '<li>Error de red al cargar playlists.</li>';
        }
    }

    function abrirEdicionPlaylist(playlist) {
        if (!formEditarPlaylist || !editPlaylistId || !editPlaylistNombre) return;
        editPlaylistId.value = playlist._id;
        editPlaylistNombre.value = playlist.nombre || '';
        if (editPlaylistDescripcion) editPlaylistDescripcion.value = playlist.descripcion || '';
        playlistTracksCache = Array.isArray(playlist.tracks)
            ? playlist.tracks.map((t) => (typeof t === 'object' ? t._id : t))
            : [];
        llenarSelectTracks(playlistTracksCache);
        formEditarPlaylist.style.display = 'block';
        editPlaylistNombre.focus();
    }

    function cerrarEdicionPlaylist() {
        if (!formEditarPlaylist) return;
        formEditarPlaylist.style.display = 'none';
        if (editPlaylistId) editPlaylistId.value = '';
        if (editPlaylistNombre) editPlaylistNombre.value = '';
        if (editPlaylistDescripcion) editPlaylistDescripcion.value = '';
        playlistTracksCache = [];
        llenarSelectTracks();
    }

    async function eliminarPlaylist(id, nombre) {
        if (!confirm('¿Eliminar la playlist "' + nombre + '"?')) return;

        try {
            const response = await fetch('/api/playlists/' + id, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                if (estadoPlaylist) estadoPlaylist.innerText = 'Playlist eliminada.';
                if (editPlaylistId && editPlaylistId.value === id) cerrarEdicionPlaylist();
                cargarPlaylists();
            } else {
                alert(data.error || data.mensaje || 'No se pudo eliminar');
            }
        } catch (err) {
            console.error(err);
            alert('Error de red al eliminar la playlist.');
        }
    }

    if (formCrearPlaylist) {
        formCrearPlaylist.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = playlistNombre ? playlistNombre.value.trim() : '';
            const descripcion = playlistDescripcion ? playlistDescripcion.value.trim() : '';

            if (!nombre) return alert('El nombre de la playlist es requerido.');

            try {
                const response = await fetch('/api/playlists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, descripcion }),
                    credentials: 'include',
                });
                const data = await response.json();

                if (response.ok) {
                    if (estadoPlaylist) estadoPlaylist.innerText = 'Playlist creada.';
                    formCrearPlaylist.reset();
                    cargarPlaylists();
                } else {
                    alert(data.error || data.mensaje || 'No se pudo crear');
                }
            } catch (err) {
                console.error(err);
                alert('Error de red al crear la playlist.');
            }
        });
    }

    if (btnGuardarPlaylist) {
        btnGuardarPlaylist.addEventListener('click', async () => {
            const id = editPlaylistId ? editPlaylistId.value : '';
            const nombre = editPlaylistNombre ? editPlaylistNombre.value.trim() : '';
            const descripcion = editPlaylistDescripcion ? editPlaylistDescripcion.value.trim() : '';
            const trackToAdd = editPlaylistTrackSelect ? editPlaylistTrackSelect.value : '';

            if (!id) return alert('No hay playlist seleccionada.');
            if (!nombre) return alert('El nombre no puede estar vacío.');

            const tracks = playlistTracksCache.slice();
            if (trackToAdd && !tracks.includes(trackToAdd)) {
                tracks.push(trackToAdd);
            }

            try {
                btnGuardarPlaylist.disabled = true;
                const response = await fetch('/api/playlists/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, descripcion, tracks }),
                    credentials: 'include',
                });
                const data = await response.json();

                if (response.ok) {
                    if (estadoPlaylist) estadoPlaylist.innerText = 'Playlist actualizada.';
                    cerrarEdicionPlaylist();
                    cargarPlaylists();
                } else {
                    alert(data.error || data.mensaje || 'No se pudo actualizar');
                }
            } catch (err) {
                console.error(err);
                alert('Error de red al actualizar la playlist.');
            } finally {
                btnGuardarPlaylist.disabled = false;
            }
        });
    }

    if (btnCancelarEditPlaylist) {
        btnCancelarEditPlaylist.addEventListener('click', cerrarEdicionPlaylist);
    }

    if (btnRefreshPlaylists) {
        btnRefreshPlaylists.addEventListener('click', cargarPlaylists);
    }

    cargarTracks();
    cargarPlaylists();
});
