import {useEffect, useMemo, useState} from "react";
import {useAtom} from "jotai";
import toast from "react-hot-toast";
import NumberGrid from "../NumberGrid";
import {adminSelectionAtom} from "../state/gameAtoms";
import {gamesApi, type GameDto} from "@utilities/gamesApi.ts";
import {adminApi} from "@utilities/adminApi.ts";

export default function AdminWinningNumbersPage() {
    const [selectedNumbers, setSelectedNumbers] = useAtom(adminSelectionAtom);
    const [games, setGames] = useState<GameDto[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const toggleNumber = (value: number) => {
        setSelectedNumbers((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
        );
    };

    useEffect(() => {
        const loadGames = async () => {
            try {
                const response = await gamesApi.getAll();
                setGames(response);

                const preferredGame = response
                    .find((game) => (game.winningNumbers?.length ?? 0) < 3) ?? response[0];
                setSelectedGameId(preferredGame?.gameId ?? "");
            } catch (error) {
                console.error(error);
                toast.error("Could not load games");
            } finally {
                setLoading(false);
            }
        };

        loadGames();
    }, []);

    const activeGame = useMemo(
        () => games.find((game) => game.gameId === selectedGameId) ?? null,
        [games, selectedGameId]
    );

    const canPublish = selectedNumbers.length === 3 && !!activeGame && (activeGame.winningNumbers?.length ?? 0) < 3;

    const handlePublish = async () => {
        if (!activeGame) return;
        setSaving(true);

        try {
            await adminApi.publishWinningNumbers(activeGame.gameId, selectedNumbers);
            toast.success("Winning numbers saved for this game.");
            setSelectedNumbers([]);

            const refreshed = await gamesApi.getAll();
            setGames(refreshed);
            const nextGame = refreshed.find((game) => game.gameId === activeGame.gameId) ?? refreshed[0];
            setSelectedGameId(nextGame?.gameId ?? "");
        } catch (error) {
            console.error(error);
            toast.error("Could not publish winning numbers.");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateGame = async () => {
        setSaving(true);
        try {
            const nextSaturday = (() => {
                const today = new Date();
                const result = new Date(today);
                const day = today.getDay();
                const daysUntilSaturday = (6 - day + 7) % 7 || 7;
                result.setDate(today.getDate() + daysUntilSaturday);
                result.setHours(23, 59, 59, 999);
                return result.toISOString();
            })();

            const created = await gamesApi.create(nextSaturday);
            const refreshed = await gamesApi.getAll();
            setGames(refreshed);
            setSelectedGameId(created.gameId);
            toast.success("New game created for this week.");
        } catch (error) {
            console.error(error);
            toast.error("Could not create a new game.");
        } finally {
            setSaving(false);
        }
    };

    const gameStatusLabel = activeGame
        ? (activeGame.winningNumbers?.length ?? 0) >= 3
            ? "Winning numbers already published"
            : "Awaiting winning numbers"
        : "No game selected";

    return (
        <section className="space-y-8">
            <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin only</p>
                <h2 className="text-3xl font-semibold text-slate-900">Publish Winning Numbers</h2>
                <p className="mt-2 max-w-2xl text-slate-600">
                    Select the three numbers that were drawn from the hat this Saturday.
                </p>
            </div>
            <div className="space-y-4 rounded-3xl bg-white/80 p-6 shadow-lg shadow-orange-100">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Target game</p>
                        <p className="text-lg font-semibold text-slate-800">{activeGame ? new Date(activeGame.expirationDate).toDateString() : "No game selected"}</p>
                        <p className="text-sm text-slate-500">{gameStatusLabel}</p>
                    </div>
                    <div className="flex flex-col gap-2 md:w-64">
                        <select
                            value={selectedGameId}
                            onChange={(event) => setSelectedGameId(event.target.value)}
                            className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm shadow-inner focus:border-orange-300 focus:outline-none"
                        >
                            <option value="" disabled>
                                {loading ? "Loading games…" : "Select a game"}
                            </option>
                            {games.map((game) => (
                                <option key={game.gameId} value={game.gameId}>
                                    Ends {new Date(game.expirationDate).toLocaleDateString()} {game.winningNumbers?.length ? "— Published" : "— Draft"}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleCreateGame}
                            disabled={saving}
                            className="rounded-full bg-[#f7a166] px-4 py-2 text-sm font-semibold text-white shadow-orange-200 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Create new game week
                        </button>
                    </div>
                </div>
                <NumberGrid selectedNumbers={selectedNumbers} onToggle={toggleNumber} maxSelectable={3}/>
                <div className="mt-6 flex flex-col items-center gap-4">
                    <p className="text-sm text-slate-500">Exactly three numbers are required.</p>
                    <button
                        type="button"
                        disabled={!canPublish || saving}
                        onClick={handlePublish}
                        className={`w-64 rounded-full px-6 py-3 text-lg font-semibold transition ${
                            canPublish
                                ? "bg-emerald-500 text-white shadow-xl shadow-emerald-200"
                                : "bg-slate-200 text-slate-500"
                        }`}
                    >
                        {saving ? "Saving…" : "Publish Winning Numbers"}
                    </button>
                </div>
            </div>
        </section>
    );
}