import { winningBoardsApi } from "@utilities/boardsApi";
import { boardsApi, type BoardDto } from "@utilities/boardsApi"; // adjust import path/type to your project
import { playersApi, type PlayerResponseDto } from "@utilities/playersApi";

export type UiWinnerLine = {
    winningboardId: string;
    boardId: string;
    playerId: string;
    playerName: string;
    winningNumbersMatched: number;
    timestamp: string;
    payout: number; // can be 0 if you don’t want to compute
};

function normalizeArray<T>(x: any): T[] {
    if (Array.isArray(x)) return x;
    if (x && Array.isArray(x.$values)) return x.$values;
    return [];
}

export async function buildWinnersFallback(gameId: string): Promise<UiWinnerLine[]> {
    // 1) winningboards (boardId + matched + timestamp)
    const winningBoardsRaw = await winningBoardsApi.getAll(); // must exist
    const winningBoards = normalizeArray<any>(winningBoardsRaw).filter((w) => w.gameId === gameId);

    if (winningBoards.length === 0) return [];

    // 2) boards (boardId -> playerId, and filter to same gameId if needed)
    const boardsRaw = await boardsApi.list(); // if you have getByGame(gameId), use that instead
    const boards = normalizeArray<BoardDto>(boardsRaw);

    const boardById = new Map<string, BoardDto>();
    for (const b of boards) boardById.set((b as any).boardId, b);

    // 3) players (playerId -> name/email)
    const playersRaw = await playersApi.getAll();
    const players = normalizeArray<PlayerResponseDto>(playersRaw);

    const playerById = new Map<string, PlayerResponseDto>();
    for (const p of players) playerById.set(p.playerId, p);

    // 4) Build UI winners
    return winningBoards.map((w) => {
        const board = boardById.get(w.boardId);
        const playerId = (board as any)?.playerId ?? "unknown"; // board MUST have playerId for this to work
        const player = playerById.get(playerId);

        const playerName =
            (player?.fullName?.trim() || "").length > 0
                ? player!.fullName
                : playerId || "Unknown player";

        return {
            winningboardId: w.winningboardId,
            boardId: w.boardId,
            playerId,
            playerName,
            winningNumbersMatched: w.winningNumbersMatched ?? 0,
            timestamp: w.timestamp,
            payout: 0,
        };
    }).filter(w => w.playerId); // drop rows we truly can’t map
}