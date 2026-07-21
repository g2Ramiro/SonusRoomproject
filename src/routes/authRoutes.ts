import { Request, Response, Router } from 'express';
import passport from 'passport';
import { isGoogleOAuthConfigured } from '../config/passport';

const router = Router();

if (isGoogleOAuthConfigured) {
    router.get(
        '/google',
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account',
        })
    );

    router.get(
        '/google/callback',
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req, res) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar la sesión:', err);
                    return res.redirect('/login');
                }
                res.redirect('/dashboard');
            });
        }
    );
} else {
    const oauthNotConfigured = (_req: Request, res: Response) =>
        res.status(503).json({
            error: 'Google OAuth no está configurado',
            mensaje: 'Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el archivo .env.',
        });

    router.get('/google', oauthNotConfigured);
    router.get('/google/callback', oauthNotConfigured);
}
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ mensaje: "Sesión cerrada correctamente" });
    });
});

router.get('/current-user', (req, res) => {
    if (req.user) {
        res.json({ logueado: true, usuario: req.user });
    } else {
        res.json({ logueado: false, mensaje: "No hay ninguna sesión activa" });
    }
});

export default router;