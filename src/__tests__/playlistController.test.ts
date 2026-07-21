import { Request, Response } from 'express';
import Playlist from '../models/Playlist';
import Track from '../models/Track';
import * as playlistController from '../controllers/playlistController';

jest.mock('../models/Playlist');
jest.mock('../models/Track');

describe('playlistController (Pruebas Unitarias Aisladas)', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: {},
            query: {},
            user: { _id: 'user_12345' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('getAllPlaylists', () => {
        it('debe obtener las playlists ordenadas y populadas correctamente', async () => {
            const mockPlaylists = [
                { _id: 'p1', nombre: 'Playlist 1' },
                { _id: 'p2', nombre: 'Playlist 2' },
            ];

            (Playlist.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockPlaylists),
                    }),
                }),
            });

            await playlistController.getAllPlaylists(req as Request, res as Response);

            expect(Playlist.find).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockPlaylists);
        });

        it('debe filtrar por propietarioId si se pasa en query params', async () => {
            req.query = { propietarioId: 'user_12345' };

            (Playlist.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await playlistController.getAllPlaylists(req as Request, res as Response);

            expect(Playlist.find).toHaveBeenCalledWith({ propietario: 'user_12345' });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('createPlaylist', () => {
        it('debe responder 400 si falta el nombre de la playlist', async () => {
            req.body = { descripcion: 'Sin nombre' };

            await playlistController.createPlaylist(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'El nombre de la playlist es requerido',
            });
        });

        it('debe crear y popular una playlist exitosamente', async () => {
            req.body = { nombre: 'Favoritas 2026', descripcion: 'Mis rolas' };

            const mockSavedPlaylist = {
                _id: 'playlist_123',
                nombre: 'Favoritas 2026',
                descripcion: 'Mis rolas',
                propietario: 'user_12345',
            };

            // Mock del constructor de Playlist y su método save()
            (Playlist as unknown as jest.Mock).mockImplementation(() => ({
                _id: 'playlist_123',
                save: jest.fn().mockResolvedValue(mockSavedPlaylist),
            }));

            (Playlist.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockSavedPlaylist),
                }),
            });

            await playlistController.createPlaylist(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Playlist creada exitosamente',
                playlist: mockSavedPlaylist,
            });
        });

        it('debe responder 400 si incluye tracks que no existen', async () => {
            req.body = { nombre: 'Mix', tracks: ['track_inexistente'] };

            (Track.countDocuments as jest.Mock).mockResolvedValue(0); 

            await playlistController.createPlaylist(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Uno o más tracks no existen',
            });
        });
    });

    describe('deletePlaylist', () => {
        it('debe responder 404 si la playlist a eliminar no existe', async () => {
            req.params = { id: 'p_fake' };

            (Playlist.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            await playlistController.deletePlaylist(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'Playlist no encontrada' });
        });

        it('debe eliminar la playlist si existe', async () => {
            req.params = { id: 'p_123' };

            (Playlist.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: 'p_123' });

            await playlistController.deletePlaylist(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ mensaje: 'Playlist eliminada correctamente' });
        });
    });
});