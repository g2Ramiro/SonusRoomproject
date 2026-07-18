import { Request, Response, NextFunction } from 'express';

export const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) { 
        return next(); 
    }
    
    res.status(401).json({ 
        error: 'No autorizado', 
        mensaje: 'Debes iniciar sesión para realizar esta acción.' 
    });
};