import {baseUrl} from "@core/baseUrl.ts";
import {customFetch} from "@utilities/customFetch.ts";
import { normalizeNumbers, resolvePreservedArray, asArray } from "@utilities/jsonNormalize";
import {toNumberArray} from "@utilities/preserveJson.ts";


export type BoardDto = {
    boardId: string;
    playerId: string;
    gameId: string;
    chosenNumbers: number[];
    price: number;
    timestamp: string;
};


export type WinningBoardDto = {
    winningboardId: string;
    boardId: string;
    gameId: string;
    winningNumbersMatched: number;
    timestamp: string;
};

export type PurchaseBoardRequest = {
    gameId: string;
    chosenNumbers: number[];
    isRepeating?: boolean;
    repeatUntilGameId?: string | null;
};

const jsonHeaders = {
    "Accept": "application/json",
    "Content-Type": "application/json"
};

export const boardsApi = {
        list: async (): Promise<BoardDto[]> => {
            const response = await customFetch.fetch(`${baseUrl}/api/Board`, {
                method: "GET",
                headers: { Accept: "application/json" },
            });
            if (!response.ok) throw new Error("Failed to load boards");

            const raw = await response.json();

            const boards = resolvePreservedArray<any>(raw);

            return boards.map((b) => ({
                boardId: String(b.boardId ?? b.BoardId),
                playerId: String(b.playerId ?? b.PlayerId),
                gameId: String(b.gameId ?? b.GameId),
                chosenNumbers: toNumberArray(b.chosenNumbers ?? b.ChosenNumbers),
                price: Number(b.price ?? b.Price ?? 0),
                timestamp: String(b.timestamp ?? b.Timestamp),
            }));
    },

    purchase: async (playerId: string, payload: PurchaseBoardRequest): Promise<BoardDto> => {
        const response = await customFetch.fetch(`${baseUrl}/api/Board/purchase`, {
            method: "POST",
            headers: {
                ...jsonHeaders,
                "X-Player-Id": playerId,
            },
            body: JSON.stringify({
                ...payload,
                isRepeating: payload.isRepeating ?? false,
                repeatUntilGameId: payload.repeatUntilGameId ?? null,
            }),
        });

        if (!response.ok) throw new Error("Failed to purchase board");

        const data: any = await response.json();
        return {
            boardId: String(data.boardId ?? data.BoardId),
            playerId: String(data.playerId ?? data.PlayerId),
            gameId: String(data.gameId ?? data.GameId),
            chosenNumbers: toNumberArray(data.chosenNumbers ?? data.ChosenNumbers),
            price: Number(data.price ?? data.Price ?? 0),
            timestamp: String(data.timestamp ?? data.Timestamp),
        };
    },
};


export const winningBoardsApi = {
        async list(): Promise<WinningBoardDto[]> {
            const response = await customFetch.fetch(`${baseUrl}/api/WinningBoard`, {
                method: "GET",
                headers: { Accept: "application/json" },
            });

            if (!response.ok) throw new Error("Failed to fetch winning boards");

            const data: unknown = await response.json();
            const items = asArray<any>(data);

            return items.map((w) => ({
                winningboardId: String(w.winningboardId ?? w.WinningboardId),
                boardId: String(w.boardId ?? w.BoardId),
                gameId: String(w.gameId ?? w.GameId),
                winningNumbersMatched: Number(w.winningNumbersMatched ?? w.WinningNumbersMatched ?? 0),
                timestamp: String(w.timestamp ?? w.Timestamp),
            }));
    },

    async compute(gameId: string): Promise<void> {
        const response = await customFetch.fetch(
            `${baseUrl}/api/WinningBoard/${gameId}/compute-winningboards`,
            { method: "POST", headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error("Failed to compute winning boards");
    }


}