import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Toma perfil y email de google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//Redireccion en caso de exito
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login-error' }),
    (req, res) => {
        //Redireccion temporal
        res.redirect('/');
    }
);

//Cerrar sesión
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ mensaje: "Sesión cerrada correctamente" });
    });
});

// Corrobora si algun usuario conectado
router.get('/current-user', (req, res) => {
    if (req.user) {
        res.json({ logueado: true, usuario: req.user });
    } else {
        res.json({ logueado: false, mensaje: "No hay ninguna sesión activa" });
    }
});

export default router;