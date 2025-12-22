import { baseUrl } from "@core/baseUrl";
import { customFetch } from "@utilities/customFetch";

/* ---------- Normalizer ---------- */
export function normalizeArray<T>(x: any): T[] {
    if (Array.isArray(x)) return x;
    if (x && Array.isArray(x.$values)) return x.$values;
    return [];
}

/* ---------- DTOs ---------- */
export type BoardDto = {
    boardId: string;
    playerId: string;
    gameId: string;
    chosenNumbers: number[];
    timestamp: string;
    price: number;
};

export type WinningBoardDto = {
    winningboardId: string;
    boardId: string;
    gameId: string;
    winningNumbersMatched: number;
    timestamp: string;
};

/* ---------- Boards API ---------- */
export const boardsApi = {
    async list(): Promise<BoardDto[]> {
        const res = await customFetch.fetch(`${baseUrl}/boards`, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch boards");

        const raw = await res.json();
        return normalizeArray<any>(raw).map((b) => ({
            boardId: String(b.boardId ?? b.BoardId ?? ""),
            playerId: String(b.playerId ?? b.PlayerId ?? ""),
            gameId: String(b.gameId ?? b.GameId ?? ""),
            chosenNumbers: normalizeArray<number>(b.chosenNumbers ?? b.ChosenNumbers),
            timestamp: String(b.timestamp ?? b.Timestamp ?? ""),
            price: Number(b.price ?? b.Price ?? 0),
        }));
    },

    async purchase(
        playerId: string,
        payload: {
            gameId: string;
            chosenNumbers: number[];
            isRepeating: boolean;
            repeatUntilGameId: string | null;
        }
    ): Promise<void> {
        const res = await customFetch.fetch(`${baseUrl}/boards/purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId, ...payload }),
        });

        if (!res.ok) throw new Error("Failed to purchase board");
    },
};

/* ---------- Winning boards ---------- */
export const winningBoardsApi = {
    async getAll(): Promise<WinningBoardDto[]> {
        const res = await customFetch.fetch(`${baseUrl}/winningboards`, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch winning boards");

        const raw = await res.json();
        return normalizeArray<any>(raw).map((w) => ({
            winningboardId: String(w.winningboardId ?? w.WinningboardId ?? ""),
            boardId: String(w.boardId ?? w.BoardId ?? ""),
            gameId: String(w.gameId ?? w.GameId ?? ""),
            winningNumbersMatched: Number(w.winningNumbersMatched ?? w.WinningNumbersMatched ?? 0),
            timestamp: String(w.timestamp ?? w.Timestamp ?? ""),
        }));
    },

    async compute(gameId: string): Promise<void> {
        const res = await customFetch.fetch(
            `${baseUrl}/api/WinningBoard/${gameId}/compute-winningboards`,
            { method: "POST" }
        );
        if (!res.ok) throw new Error("Failed to compute winning boards");
    },
};