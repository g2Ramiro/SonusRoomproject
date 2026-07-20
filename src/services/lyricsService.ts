const LYRICS_API_BASE = 'https://api.lyrics.ovh/v1';

export class LyricsNotFoundError extends Error {
    constructor(artista: string, titulo: string) {
        super(`No se encontró letra para "${titulo}" de ${artista}`);
        this.name = 'LyricsNotFoundError';
    }
}

export class LyricsApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LyricsApiError';
    }
}


export async function fetchLyricsFromExternalApi(
    artista: string,
    titulo: string
): Promise<string> {
    const artist = encodeURIComponent(artista.trim());
    const title = encodeURIComponent(titulo.trim());
    const url = `${LYRICS_API_BASE}/${artist}/${title}`;

    let response: Response;
    try {
        response = await fetch(url);
    } catch {
        throw new LyricsApiError('No se pudo contactar la API de letras (lyrics.ovh)');
    }

    if (response.status === 404) {
        throw new LyricsNotFoundError(artista, titulo);
    }

    if (!response.ok) {
        throw new LyricsApiError(`lyrics.ovh respondió con estado ${response.status}`);
    }

    const data = (await response.json()) as { lyrics?: string; error?: string };

    if (!data.lyrics || !String(data.lyrics).trim()) {
        throw new LyricsNotFoundError(artista, titulo);
    }

    return String(data.lyrics).trim();
}
