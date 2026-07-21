import {
    fetchLyricsFromExternalApi,
    LyricsApiError,
    LyricsNotFoundError,
} from '../services/lyricsService';

describe('fetchLyricsFromExternalApi', () => {
    const fetchMock = jest.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = fetchMock;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('codifica los parámetros y devuelve la letra sin espacios exteriores', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ lyrics: '  línea uno\nlínea dos  ' }),
        });

        await expect(
            fetchLyricsFromExternalApi(' Café Tacvba ', ' Eres tú ')
        ).resolves.toBe('línea uno\nlínea dos');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.lyrics.ovh/v1/Caf%C3%A9%20Tacvba/Eres%20t%C3%BA'
        );
    });

    it('lanza LyricsNotFoundError ante una respuesta 404', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 404,
        });

        await expect(fetchLyricsFromExternalApi('Artista', 'Canción')).rejects.toEqual(
            new LyricsNotFoundError('Artista', 'Canción')
        );
    });

    it.each([{ lyrics: '' }, { lyrics: '   ' }, { error: 'No lyrics found' }])(
        'considera ausente una letra vacía: %p',
        async (body) => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(body),
            });

            await expect(fetchLyricsFromExternalApi('Artista', 'Canción')).rejects.toBeInstanceOf(
                LyricsNotFoundError
            );
        }
    );

    it('convierte los estados HTTP inesperados en LyricsApiError', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 503,
        });

        await expect(fetchLyricsFromExternalApi('Artista', 'Canción')).rejects.toEqual(
            new LyricsApiError('lyrics.ovh respondió con estado 503')
        );
    });

    it('convierte los fallos de red en LyricsApiError', async () => {
        fetchMock.mockRejectedValue(new TypeError('network error'));

        await expect(fetchLyricsFromExternalApi('Artista', 'Canción')).rejects.toEqual(
            new LyricsApiError('No se pudo contactar la API de letras (lyrics.ovh)')
        );
    });
});
