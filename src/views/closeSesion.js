document.addEventListener('DOMContentLoaded', () => {
        const btnLogout = document.getElementById('btnLogout');
        
        if (btnLogout) {
            btnLogout.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    const response = await fetch('/api/auth/logout', { 
                        method: 'GET',
                        credentials: 'include'
                    });

                    if (response.ok) {
                        window.location.href = '/login';
                    } else {
                        alert('No se pudo cerrar la sesión en el servidor.');
                    }
                } catch (err) {
                    console.error('Error al intentar cerrar sesión:', err);
                    alert('Error de red al cerrar sesión.');
                }
            });
        }
    });