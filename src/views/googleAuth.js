 async function verificarSesion() {
            try {
                const response = await fetch('/api/auth/current-user', { credentials: 'include' });
                const data = await response.json();

                if (!data.logueado) {
                    window.location.href = '/login';
                } else {
                    document.getElementById('user-display').textContent = `Hola, ${data.usuario.nombre}`;
                }
            } catch (error) {
                console.error("Error validando sesión:", error);
                window.location.href = '/login';
            }
        }