import { Request, Response } from 'express';

export const health = (_req: Request, res: Response): void => {
    res.status(200).json({
        status: 'ok',
        service: 'sonusroom-backend',
        timestamp: new Date().toISOString(),
    });
};

export const dummy = (_req: Request, res: Response): void => {
    res.status(200).json({
        message: 'Dummy endpoint',
        data: {
            foo: 'bar',
            version: '1.0.0',
        },
    });
};
