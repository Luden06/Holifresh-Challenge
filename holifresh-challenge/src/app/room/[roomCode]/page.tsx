"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Trophy,
    Users,
    Target,
    CheckCircle2,
    AlertCircle,
    PlusCircle,
    TrendingUp,
    User as UserIcon
} from "lucide-react";
import { formatCents, cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export default function RoomPage() {
    const { roomCode } = useParams();
    const router = useRouter();

    const [participant, setParticipant] = useState<{ id: string, name: string, token: string } | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${roomCode}/summary`);
            if (res.ok) {
                setSummary(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [roomCode]);

    useEffect(() => {
        // Check for participant identity
        const token = localStorage.getItem(`room_${roomCode}_token`);
        const name = localStorage.getItem(`room_${roomCode}_name`);
        const id = localStorage.getItem(`room_${roomCode}_id`);

        if (!token || !name || !id) {
            router.push(`/join/${roomCode}`);
            return;
        }

        setParticipant({ id, name, token });
        fetchSummary();

        const interval = setInterval(fetchSummary, 5000);
        return () => clearInterval(interval);
    }, [roomCode, router, fetchSummary]);

    async function handleClaim() {
        if (!participant || claiming) return;

        setClaiming(true);
        setFeedback(null);

        // Haptic feedback if supported
        if (typeof window !== "undefined" && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }

        try {
            const res = await fetch(`/api/rooms/${roomCode}/claim`, {
                method: "POST",
                body: JSON.stringify({
                    participantToken: participant.token,
                    clientRequestId: uuidv4(),
                }),
            });

            if (res.ok) {
                setFeedback({ type: 'success', message: "+1 RDV Validé !" });
                fetchSummary();
                // Clear success feedback after 3s
                setTimeout(() => setFeedback(null), 3000);
            } else {
                const err = await res.json();
                setFeedback({ type: 'error', message: err.error || "Une erreur est survenue" });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: "Impossible de valider le RDV" });
        } finally {
            setClaiming(false);
        }
    }

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Find personal score
    const personalStats = summary?.leaderboard?.find((p: any) => p.id === participant?.id);

    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col min-h-screen gap-6 pb-24 md:pb-8">
            {/* Header / Stats Summary */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-holi-orange/10 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-holi-orange" />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-xl leading-tight text-holi-navy">{summary?.roomName}</h1>
                        <p className="text-holi-grey text-xs flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> {participant?.name}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xl font-heading font-black text-holi-red">{formatCents(personalStats?.businessCents || 0)}</p>
                    <p className="text-[10px] text-holi-grey uppercase tracking-widest font-bold">Mon Business</p>
                </div>
            </header>

            {/* Team Progress Card */}
            <div className="card bg-gradient-to-br from-holi-blue/5 to-white border-holi-blue/10 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-holi-blue" />
                        <h2 className="font-subheading font-bold">Total Équipe</h2>
                    </div>
                    <span className="text-sm font-bold bg-holi-blue/10 text-holi-blue px-2.5 py-0.5 rounded-full ring-1 ring-holi-blue/20">
                        {summary?.totals} / {summary?.objectiveTotal}
                    </span>
                </div>

                <div className="relative h-4 bg-black/5 rounded-full overflow-hidden shadow-inner border border-black/5">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-holi-orange to-holi-red transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(summary?.objectiveProgress || 0, 100)}%` }}
                    />
                </div>
            </div>

            {/* Main Claim Button Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
                <div className="text-center space-y-2">
                    <p className="text-holi-grey/60 uppercase tracking-[0.3em] font-black text-[10px]">Appuie pour déclarer</p>
                    <p className="text-3xl font-heading font-black text-holi-navy italic tracking-tighter uppercase">Probe Qualifié</p>
                </div>

                <div className="relative">
                    {/* Decorative rings */}
                    <div className={cn(
                        "absolute -inset-4 bg-holi-orange/10 rounded-full animate-pulse transition-opacity duration-500",
                        claiming ? "opacity-0" : "opacity-100"
                    )} />

                    <button
                        onClick={handleClaim}
                        disabled={claiming || summary?.status !== "OPEN"}
                        className={cn(
                            "relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-2xl overflow-hidden",
                            summary?.status === "OPEN"
                                ? "bg-gradient-to-b from-holi-orange to-holi-red shadow-holi-orange/40 text-white cursor-pointer"
                                : "bg-neutral-200 shadow-none text-neutral-400 cursor-not-allowed"
                        )}
                    >
                        <PlusCircle className={cn("w-16 h-16", claiming && "animate-spin")} />
                        <span className="font-heading font-black text-xl tracking-tighter uppercase">Boom !</span>

                        {/* Gleam effect */}
                        <div className="absolute top-0 -left-full w-full h-full bg-white/30 -skew-x-[45deg] animate-[shimmer_3s_infinite]" />
                    </button>
                </div>

                {/* Feedback Messages */}
                <div className="h-10">
                    {feedback && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl animate-float border font-bold italic",
                            feedback.type === 'success' ? "bg-holi-blue/10 border-holi-blue/20 text-holi-blue" : "bg-holi-pink/10 border-holi-pink/20 text-holi-pink"
                        )}>
                            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span>{feedback.message}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Leaderboard Section (Scrollable) */}
            <div className="card p-0 overflow-hidden shadow-lg border-holi-navy/5">
                <div className="p-4 bg-holi-navy/[0.02] flex items-center justify-between border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-holi-yellow" />
                        <h3 className="font-heading font-black uppercase tracking-wider text-sm text-holi-navy">Leaderboard Probes</h3>
                    </div>
                    <p className="text-[10px] text-holi-grey font-bold">Total : {formatCents(summary?.businessTotalCents || 0)}</p>
                </div>

                <div className="divide-y divide-black/5">
                    {summary?.leaderboard?.map((p: any, idx: number) => (
                        <div key={p.id} className={cn(
                            "flex items-center justify-between p-4",
                            p.id === participant?.id && "bg-holi-orange/5"
                        )}>
                            <div className="flex items-center gap-4">
                                <span className={cn(
                                    "w-6 text-center font-black text-sm",
                                    idx === 0 ? "text-holi-yellow" : idx === 1 ? "text-holi-grey" : idx === 2 ? "text-holi-red" : "text-black/20"
                                )}>
                                    {idx + 1}
                                </span>
                                <span className={cn("font-bold", p.id === participant?.id ? "text-holi-orange" : "text-holi-navy")}>
                                    {p.displayName} {p.id === participant?.id && "(Moi)"}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-holi-dark">{p.score} <span className="text-[10px] text-holi-grey font-bold">RDV</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Absolute Bottom Counter Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-black/5 flex items-center justify-around md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="text-center">
                    <p className="text-xs text-holi-grey uppercase tracking-widest font-black">Mes RDVs</p>
                    <p className="text-xl font-black text-holi-red">{personalStats?.score || 0}</p>
                </div>
                <div className="w-px h-8 bg-black/5" />
                <div className="text-center">
                    <p className="text-xs text-holi-grey uppercase tracking-widest font-black">Équipe</p>
                    <p className="text-xl font-black text-holi-orange">{summary?.totals}</p>
                </div>
            </div>
        </div>
    );
}
