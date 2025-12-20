import {baseUrl} from "@core/baseUrl.ts";
import {customFetch} from "@utilities/customFetch.ts";
import {asArray, asNumberArray} from "@utilities/arrayNormalize.ts";

export type GameDto = {
    gameId: string;
    winningNumbers?: number[] | null;
    drawDate?: string | null;
    expirationDate: string;
};

const jsonHeaders = {
    "Accept": "application/json",
    "Content-Type": "application/json"
};


export const gamesApi = {
    async getAll(): Promise<GameDto[]> {
        const response = await customFetch.fetch(`${baseUrl}/api/Game`, {
            method: "GET",
            headers: jsonHeaders
        });

        if (!response.ok) throw new Error("Failed to fetch games");

        const data: unknown = await response.json();

        return asArray<GameDto>(data).map((game) => ({
            ...game,
            winningNumbers: asNumberArray(game.winningNumbers)
        }));

},

    async create(expirationDate: string): Promise<GameDto> {
        const response = await customFetch.fetch(`${baseUrl}/api/Game`, {
            method: "POST",
            headers: jsonHeaders,
            body: JSON.stringify({ expirationDate: expirationDate }),
        });



        const game = await response.json();
    return {
        ...game,
        winningNumbers: asNumberArray(game.winningNumbers)
    };

    }
};