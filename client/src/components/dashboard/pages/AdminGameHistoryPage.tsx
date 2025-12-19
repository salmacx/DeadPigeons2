import {useEffect, useMemo, useState} from "react";
import toast from "react-hot-toast";
import {adminApi, type AdminPayoutOverview} from "@utilities/adminApi.ts";
import {gamesApi, type GameDto} from "@utilities/gamesApi.ts";
import {playersApi, type PlayerResponseDto} from "@utilities/playersApi.ts";

function formatCurrency(amount?: number) {
    if (amount === undefined || amount === null) return "0";
    return amount.toLocaleString("da-DK", {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

export default function AdminGameHistoryPage() {

    const [games, setGames] = useState<GameDto[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string>("");
    const [overview, setOverview] = useState<AdminPayoutOverview | null>(null);
    const [players, setPlayers] = useState<PlayerResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingOverview, setLoadingOverview] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [gamesResponse, playersResponse] = await Promise.all([
                    gamesApi.getAll(),
                    playersApi.getAll()
                ]);

                const nextGames = Array.isArray(gamesResponse) ? gamesResponse : [];
                const nextPlayers = Array.isArray(playersResponse) ? playersResponse : [];

                setGames(nextGames);
                setPlayers(nextPlayers);

                const completed = nextGames.filter((game) => (game.winningNumbers?.length ?? 0) >= 3);
                const fallbackGame = completed[0] ?? nextGames[0];
                if (fallbackGame) {
                    setSelectedGameId(fallbackGame.gameId);
                    await loadOverview(fallbackGame.gameId);
                }
            } catch (error) {
                console.error(error);
                toast.error("Could not load games.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const loadOverview = async (gameId: string) => {
        setLoadingOverview(true);
        try {
            const response = await adminApi.getPayoutOverview(gameId);
            setOverview(response);
        } catch (error) {
            console.error(error);
            toast.error("Could not load game results.");
            setOverview(null);
        } finally {
            setLoadingOverview(false);
        }
    };

    const selectedGame = useMemo(
        () => games.find((game) => game.gameId === selectedGameId) ?? null,
        [games, selectedGameId]
    );

    const playerLookup = useMemo(() => {
        const map = new Map<string, PlayerResponseDto>();
        players.forEach((player) => map.set(player.playerId, player));
        return map;
    }, [players]);

    const stats = [
        {label: "Total players this round", value: overview?.totalPlayers ?? 0},
        {label: "Total prize money", value: formatCurrency(overview?.totalPrizePool)},
        {label: "Number of winners", value: overview?.winnerCount ?? 0},
        {label: "Amount each winner won", value: formatCurrency(overview?.payoutPerWinner)},
        {label: "Profit (30%) from total earned", value: formatCurrency(overview?.profit30Percent)}
    ];

    return (
        <section className="space-y-6">
            <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Weekly overview</p>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold text-slate-900">Game History</h2>
                        <p className="mt-2 max-w-2xl text-slate-600">
                            Review results, prize splits, and winners for completed games. All amounts come directly from the backend
                            calculations.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 md:w-64">
                        <select
                            value={selectedGameId}
                            onChange={(event) => {
                                const nextId = event.target.value;
                                setSelectedGameId(nextId);
                                if (nextId) void loadOverview(nextId);
                            }}
                            className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm shadow-inner focus:border-orange-300 focus:outline-none"
                        >
                            <option value="" disabled>
                                {loading ? "Loading games…" : "Select a game"}
                            </option>
                            {games.map((game) => (
                                <option key={game.gameId} value={game.gameId}>
                                    Ends {new Date(game.expirationDate).toLocaleDateString()} {game.winningNumbers?.length ? "— Results" : "— Pending"}
                                </option>

                            ))}

                        </select>
                        {selectedGame && (
                            <p className="text-xs text-slate-500">
                                {selectedGame.winningNumbers?.length ? `Winning numbers: ${selectedGame.winningNumbers.join(", ")}` : "Winning numbers not yet published"}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
                {stats.map((stat) => (
                    <article key={stat.label} className="rounded-3xl bg-white/80 p-5 text-center shadow-lg shadow-orange-100">
                        <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {loadingOverview ? "…" : stat.value}
                        </p>
                    </article>
                ))}
            </div>

            <article className="space-y-4 rounded-3xl bg-white/80 p-6 shadow-lg shadow-orange-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Winning players</p>
                        <h3 className="text-2xl font-semibold text-slate-900">Payout overview</h3>
                        <p className="text-sm text-slate-500">All amounts are already split in the backend.</p>
                    </div>
                </div>

                {loadingOverview && (
                    <p className="text-slate-500">Loading results…</p>
                )}

                {!loadingOverview && overview && overview.winners.length === 0 && (
                    <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-slate-600">No winners this round.</p>
                )}

                {!loadingOverview && overview && overview.winners.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-orange-100 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-2">Player</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Amount won</th>
                                <th className="px-4 py-2">Board</th>
                            </tr>
                            </thead>
                            <tbody>
                            {overview.winners.map((winner) => {
                                const player = playerLookup.get(winner.playerId);
                                return (
                                    <tr key={winner.winningboardId} className="border-b border-orange-50">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{winner.playerName || "Unknown player"}</td>
                                        <td className="px-4 py-3 text-slate-600">{player?.email ?? "—"}</td>
                                        <td className="px-4 py-3 text-slate-800">{formatCurrency(winner.payout)} kr</td>
                                        <td className="px-4 py-3 text-slate-500">{winner.boardId}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </article>
        </section>
    );
}