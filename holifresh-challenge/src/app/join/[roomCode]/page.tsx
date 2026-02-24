"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserCheck, Sparkles, Hash } from "lucide-react";

export default function JoinPage() {
    const { roomCode } = useParams();
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/rooms/${roomCode}/join`, {
                method: "POST",
                body: JSON.stringify({ displayName, joinCode }),
            });

            if (res.ok) {
                const data = await res.json();
                // Store technical identity locally
                localStorage.setItem(`room_${roomCode}_token`, data.participantToken);
                localStorage.setItem(`room_${roomCode}_name`, data.displayName);
                localStorage.setItem(`room_${roomCode}_id`, data.participantId);

                router.push(`/room/${roomCode}`);
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

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 text-lg font-black uppercase tracking-widest"
                    >
                        {loading ? "Chargement..." : "Commençons !"}
                    </button>
                </form>
            </div>
        </div>
    );
}
