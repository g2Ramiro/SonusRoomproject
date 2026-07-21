import { NextFunction, Request, Response } from 'express';
import { isAuthorized } from '../middlewares/authMiddleware';

describe('isAuthorized', () => {
    const status = jest.fn();
    const json = jest.fn();
    const next: NextFunction = jest.fn();

    const makeRequest = (authenticated: boolean) =>
        ({
            isAuthenticated: jest.fn().mockReturnValue(authenticated),
        }) as unknown as Request;

    const response = {
        status,
        json,
    } as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
        status.mockReturnValue(response);
        json.mockReturnValue(response);
    });

    it('continúa con la petición cuando hay una sesión autenticada', () => {
        const req = makeRequest(true);

        isAuthorized(req, response, next);

        expect(req.isAuthenticated).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(1);
        expect(status).not.toHaveBeenCalled();
    });

    it('responde 401 cuando no hay una sesión autenticada', () => {
        const req = makeRequest(false);

        isAuthorized(req, response, next);

        expect(next).not.toHaveBeenCalled();
        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({
            error: 'No autorizado',
            mensaje: 'Debes iniciar sesión para realizar esta acción.',
        });
    });
});
