import { boardsApi, type BoardDto, winningBoardsApi } from "@utilities/boardsApi";
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

const normalizeId = (value?: string | null) => String(value ?? "").trim().toLowerCase();

export async function buildWinnersFallback(
    gameId: string,
    options?: { players?: PlayerResponseDto[]; boards?: BoardDto[]; gameWinningNumbers?: number[] }
): Promise<UiWinnerLine[]> {
    const targetId = normalizeId(gameId);

    const countMatches = (chosen: number[], winning: number[]) =>
        chosen.filter((n) => winning.includes(n)).length;

    // 1) winningboards (boardId + matched + timestamp)
    let winningBoards: any[] = [];
    try {
        const winningBoardsRaw = await winningBoardsApi.getAll();
        winningBoards = normalizeArray<any>(winningBoardsRaw).filter((w) => normalizeId(w.gameId) === targetId);
    } catch (error) {
        console.warn("winningBoardsApi.getAll failed, falling back to board comparison", error);
    }

    // 2) boards (boardId -> playerId, and filter to same gameId if needed)
    const boardsRaw = options?.boards ?? (await boardsApi.list()); // if you have getByGame(gameId), use that instead
    const boards = normalizeArray<BoardDto>(boardsRaw);

    const boardById = new Map<string, BoardDto>();
    for (const b of boards) boardById.set(normalizeId((b as any).boardId), b);

    // 3) players (playerId -> name/email)
    const playersRaw = options?.players ?? (await playersApi.getAll());
    const players = normalizeArray<PlayerResponseDto>(playersRaw);

    const playerById = new Map<string, PlayerResponseDto>();
    for (const p of players) playerById.set(normalizeId(p.playerId), p);

    // 4) Build UI winners
    const mapToUi = (row: {
        winningboardId: string;
        boardId: string;
        playerId?: string;
        winningNumbersMatched: number;
        timestamp: string;
    }) => {
        const board = boardById.get(normalizeId(row.boardId));
        const playerIdRaw = (board as any)?.playerId ?? row.playerId ?? ""; // fall back to WinningBoard payload when board lookup fails
        const normalizedPlayerId = normalizeId(playerIdRaw);
        const player = playerById.get(normalizedPlayerId);

        const normalizedFullName = player?.fullName?.trim();
        const derivedPlayerId = player?.playerId ?? playerIdRaw ?? normalizedPlayerId;
        const playerName = normalizedFullName && normalizedFullName.length > 0 ? normalizedFullName : derivedPlayerId || "Unknown player";

        return {
            winningboardId: row.winningboardId,
            boardId: row.boardId,
            playerId: derivedPlayerId,
            playerName,
            winningNumbersMatched: row.winningNumbersMatched ?? 0,
            timestamp: row.timestamp,
            payout: 0,
        };
    };

    // 4) If backend has winning boards, use them
    const mappedWinningBoards = winningBoards.map((w) =>
        mapToUi({
            winningboardId: w.winningboardId,
            boardId: w.boardId,
            playerId: (w as any)?.playerId,
            winningNumbersMatched: w.winningNumbersMatched ?? 0,
            timestamp: w.timestamp,
        })
    );

    if (mappedWinningBoards.length > 0) return mappedWinningBoards.filter((w) => w.playerId);

    // 5) No winning board rows; derive winners the same way the player UI does
    const winningNumbers = normalizeArray<number>(options?.gameWinningNumbers ?? []);
    if (winningNumbers.length === 0) return [];

    const boardsForGame = boards.filter((b) => normalizeId(b.gameId) === targetId);
    const derived = boardsForGame
        .map((board) => {
            const matched = countMatches(normalizeArray<number>(board.chosenNumbers), winningNumbers);
            if (matched === 0) return null;

            return mapToUi({
                winningboardId: `fallback-${board.boardId}`,
                boardId: board.boardId,
                playerId: board.playerId,
                winningNumbersMatched: matched,
                timestamp: board.timestamp,
            });
        })
        .filter(Boolean) as UiWinnerLine[];

    return derived.filter((w) => w.playerId);
}