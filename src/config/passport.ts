import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';

export const isGoogleOAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (isGoogleOAuthConfigured) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    // Verificar si existe el usuario
                    let user = await User.findOne({ googleId: profile.id });

                    if (!user) {
                        // Se crea si no existe
                        user = new User({
                            googleId: profile.id,
                            nombre: profile.displayName,
                            email: profile.emails?.[0].value || profile._json.email,
                            avatar: profile.photos?.[0].value,
                        });
                        await user.save();
                        console.log(`Nuevo usuario registrado: ${user.nombre}`);
                    } else {
                        console.log(`Usuario existente iniciando sesión: ${user.nombre}`);
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

//Guarda el ID del usuario en la sesión
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

// Recupera al usuario completo desde la base de datos usando el ID guardado
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});