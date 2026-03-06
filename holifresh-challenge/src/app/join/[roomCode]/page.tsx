"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserCheck, Sparkles, Hash } from "lucide-react";

export default function JoinPage() {
    const { roomCode } = useParams();
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");

    // Takeover state
    const [takeoverPrompt, setTakeoverPrompt] = useState<{
        id: string;
        displayName: string;
        points: number;
    } | null>(null);

    // If the participant already has a token, skip join and go to room
    useEffect(() => {
        const token = localStorage.getItem(`room_${roomCode}_token`);
        const name = localStorage.getItem(`room_${roomCode}_name`);
        const id = localStorage.getItem(`room_${roomCode}_id`);

        if (token && name && id) {
            router.replace(`/room/${roomCode}`);
        } else {
            setChecking(false);
        }
    }, [roomCode, router]);

    async function handleJoin(e: React.FormEvent, forceNew: boolean = false) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/rooms/${roomCode}/join`, {
                method: "POST",
                body: JSON.stringify({ displayName, joinCode, forceNew }),
            });

            if (res.ok) {
                const data = await res.json();
                // Store technical identity locally
                localStorage.setItem(`room_${roomCode}_token`, data.participantToken);
                localStorage.setItem(`room_${roomCode}_name`, data.displayName);
                localStorage.setItem(`room_${roomCode}_id`, data.participantId);

                router.push(`/room/${roomCode}`);
            } else if (res.status === 409) {
                const err = await res.json();
                if (err.requiresConfirmation) {
                    setTakeoverPrompt(err.existingParticipant);
                }
            } else {
                const err = await res.json();
                setError(err.error || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Impossible de rejoindre la room");
        } finally {
            setLoading(false);
        }
    }

    async function handleReconnect() {
        if (!takeoverPrompt) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/rooms/${roomCode}/join/reconnect`, {
                method: "POST",
                body: JSON.stringify({ participantId: takeoverPrompt.id, joinCode }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem(`room_${roomCode}_token`, data.participantToken);
                localStorage.setItem(`room_${roomCode}_name`, data.displayName);
                localStorage.setItem(`room_${roomCode}_id`, data.participantId);

                router.push(`/room/${roomCode}`);
            } else {
                const err = await res.json();
                setError(err.error || "Impossible de se reconnecter");
            }
        } catch (err) {
            setError("Erreur lors de la reconnexion");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            {checking ? (
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-holi-blue/30 border-t-holi-blue rounded-full animate-spin mx-auto"></div>
                    <p className="text-holi-grey font-bold">Chargement...</p>
                </div>
            ) : (
                <div className="card max-w-md w-full animate-float">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-holi-blue/10 rounded-full">
                            <Sparkles className="w-8 h-8 text-holi-blue" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-heading font-black text-center mb-2 text-holi-dark uppercase italic">Rejoindre l'événement</h1>
                    <p className="text-holi-grey text-center mb-8 font-bold">Participez au challenge et déclarez vos RDV</p>

                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-1.5 block px-1">Votre Nom / Pseudo</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ex: Jean-Michel"
                                        className="input-field font-bold"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-1.5 block px-1">Code de l'événement</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="CODE"
                                        className="input-field text-center font-mono uppercase tracking-[0.2em] font-black text-holi-orange"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-holi-pink text-sm text-center bg-holi-pink/10 py-2 rounded-lg border border-holi-pink/20 font-bold italic">{error}</p>}

                        {takeoverPrompt ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="p-4 bg-holi-orange/10 border border-holi-orange/20 rounded-xl mt-4">
                                    <h3 className="text-holi-dark font-black text-center mb-2">Déjà connecté ?</h3>
                                    <p className="text-holi-grey text-sm text-center mb-4 leading-relaxed">
                                        Il y a déjà un joueur nommé <span className="font-bold text-holi-dark">{takeoverPrompt.displayName}</span> ayant <span className="font-bold text-holi-dark">{takeoverPrompt.points} RDVs</span>.
                                        Est-ce bien vous qui reprenez votre partie depuis ce nouvel appareil ?
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            type="button"
                                            onClick={handleReconnect}
                                            disabled={loading}
                                            className="btn-primary w-full py-3 text-sm font-black uppercase tracking-wider"
                                        >
                                            {loading ? "Reconnexion..." : "Oui, c'est moi ! (Reconnexion)"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleJoin(e, true)}
                                            disabled={loading}
                                            className="btn-ghost w-full py-3 text-sm font-black uppercase tracking-wider border-2 border-neutral-200"
                                        >
                                            Non, créer "{displayName} (2)"
                                        </button>
                                    </div>
                                    <div className="mt-3 text-center">
                                        <button type="button" onClick={() => setTakeoverPrompt(null)} className="text-xs text-holi-grey underline hover:text-holi-dark font-bold">Annuler</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading || !displayName.trim() || !joinCode.trim()}
                                className="btn-primary w-full py-4 text-lg font-black uppercase tracking-widest mt-2"
                            >
                                {loading ? "Chargement..." : "Commençons !"}
                            </button>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}
