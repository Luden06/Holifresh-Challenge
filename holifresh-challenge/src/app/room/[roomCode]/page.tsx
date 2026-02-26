"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Trophy,
    Users,
    Target,
    CheckCircle2,
    AlertCircle,
    PlusCircle,
    TrendingUp,
    User as UserIcon,
    CalendarCheck,
    XCircle,
    Flame,
    Clock,
    MessageSquare,
    AlertTriangle
} from "lucide-react";
import { formatCents, cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

// Particle system for the "Boom" effect
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 6 + 2;
        this.color = color;
        this.life = 0;
        this.maxLife = Math.random() * 30 + 30;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.vx *= 0.98;
        this.life++;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const opacity = 1 - (this.life / this.maxLife);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const RAPID_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const SELF_CANCEL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export default function RoomPage() {
    const { roomCode } = useParams();
    const router = useRouter();

    const [participant, setParticipant] = useState<{ id: string, name: string, token: string } | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Double Kill modal
    const [rapidWarning, setRapidWarning] = useState<{ claimId: string } | null>(null);

    // Self-cancel modal
    const [selfCancelling, setSelfCancelling] = useState<any | null>(null);
    const [selfCancelReason, setSelfCancelReason] = useState("");
    const [selfCancelLoading, setSelfCancelLoading] = useState(false);

    // "Mes RDV" section
    const [showMyClaims, setShowMyClaims] = useState(false);

    // Animation refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    const fetchSummary = useCallback(async () => {
        if (!participant) return;
        try {
            const res = await fetch(`/api/rooms/${roomCode}/summary?participantId=${participant.id}`);
            if (res.ok) {
                setSummary(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [roomCode, participant]);

    useEffect(() => {
        const token = localStorage.getItem(`room_${roomCode}_token`);
        const name = localStorage.getItem(`room_${roomCode}_name`);
        const id = localStorage.getItem(`room_${roomCode}_id`);

        if (!token || !name || !id) {
            router.push(`/join/${roomCode}`);
            return;
        }

        setParticipant({ id, name, token });
    }, [roomCode, router]);

    useEffect(() => {
        if (!participant) return;

        fetchSummary();
        const interval = setInterval(fetchSummary, 5000);

        // Animation loop
        const animate = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
                particlesRef.current.forEach(p => {
                    p.update();
                    p.draw(ctx);
                });
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            clearInterval(interval);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [participant, fetchSummary]);

    const triggerBurst = () => {
        const canvas = canvasRef.current;
        const button = buttonRef.current;
        if (!canvas || !button) return;

        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const colors = ['#FF914D', '#0079ed', '#da3b17', '#ffffff'];
        for (let i = 0; i < 40; i++) {
            particlesRef.current.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
        }

        // Screen shake
        document.body.classList.add('animate-shake-short');
        setTimeout(() => document.body.classList.remove('animate-shake-short'), 200);
    };

    async function handleClaim() {
        if (!participant || claiming) return;

        setClaiming(true);
        setFeedback(null);

        if (typeof window !== "undefined" && window.navigator.vibrate) {
            window.navigator.vibrate([40, 30, 40]);
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
                const data = await res.json();
                triggerBurst();
                setFeedback({ type: 'success', message: "+1 RDV Validé !" });
                fetchSummary();

                // Check for rapid declaration (< 2 min since last)
                if (data.timeSinceLastClaim !== null && data.timeSinceLastClaim < RAPID_THRESHOLD_MS) {
                    setRapidWarning({ claimId: data.claimId });
                }

                setTimeout(() => {
                    setFeedback(null);
                    setClaiming(false);
                }, 3000);
            } else {
                const err = await res.json();
                setFeedback({ type: 'error', message: err.error || "Une erreur est survenue" });
                setClaiming(false);
            }
        } catch (err) {
            setFeedback({ type: 'error', message: "Impossible de valider le RDV" });
            setClaiming(false);
        }
    }

    async function handleRapidCancel() {
        if (!rapidWarning || !participant) return;
        try {
            await fetch(`/api/rooms/${roomCode}/claims/${rapidWarning.claimId}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantToken: participant.token,
                    reason: "Déclaration rapide annulée par le participant",
                }),
            });
            fetchSummary();
        } catch (err) {
            console.error(err);
        }
        setRapidWarning(null);
    }

    async function confirmSelfCancel() {
        if (!selfCancelling || !selfCancelReason.trim() || !participant) return;
        setSelfCancelLoading(true);
        try {
            const res = await fetch(`/api/rooms/${roomCode}/claims/${selfCancelling.id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    participantToken: participant.token,
                    reason: selfCancelReason.trim(),
                }),
            });
            if (res.ok) {
                fetchSummary();
                setSelfCancelling(null);
                setSelfCancelReason("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSelfCancelLoading(false);
        }
    }

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const personalStats = summary?.leaderboard?.find((p: any) => p.id === participant?.id);
    const personalScore = personalStats?.score || 0;
    const teamScore = summary?.totals || 0;
    const objective = summary?.objectiveTotal || 50;
    const myClaims = summary?.myClaims || [];

    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col min-h-screen gap-6 pb-24 md:pb-8 relative">
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-[100]"
                width={typeof window !== 'undefined' ? window.innerWidth : 0}
                height={typeof window !== 'undefined' ? window.innerHeight : 0}
            />

            {/* Header / Stats Summary */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-holi-orange/10 rounded-xl flex items-center justify-center">
                        <CalendarCheck className="w-6 h-6 text-holi-orange" />
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

            {/* Team Progress Card with Personal Overlay */}
            <div className="card bg-gradient-to-br from-holi-blue/5 to-white border-holi-blue/10 p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-holi-blue" />
                        <h2 className="font-subheading font-bold">Total Équipe</h2>
                    </div>
                    <span className="text-sm font-bold bg-holi-blue/10 text-holi-blue px-2.5 py-0.5 rounded-full ring-1 ring-holi-blue/20">
                        {teamScore} / {objective}
                    </span>
                </div>

                <div className="relative h-4 bg-black/5 rounded-full overflow-hidden shadow-inner border border-black/5">
                    {/* Team Progress */}
                    <div
                        className="absolute top-0 left-0 h-full bg-neutral-200 transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min((teamScore / objective) * 100, 100)}%` }}
                    />
                    {/* Personal Contribution Overlay */}
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0079ed] to-[#4DADDF] transition-all duration-1000 ease-out z-10 opacity-90 shadow-[0_0_10px_rgba(0,121,237,0.3)]"
                        style={{ width: `${Math.min((personalScore / objective) * 100, 100)}%` }}
                    />
                    {/* Team Overflow (if team > personal) */}
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF914D] to-holi-red transition-all duration-1200 ease-out"
                        style={{
                            width: `${Math.min(((teamScore - personalScore) / objective) * 100, 100)}%`,
                            left: `${Math.min((personalScore / objective) * 100, 100)}%`
                        }}
                    />
                </div>
                <p className="text-[9px] font-black text-holi-blue/60 mt-2 uppercase tracking-tight">
                    Ta contribution : {personalScore} RDV ({Math.round((personalScore / teamScore) * 100 || 0)}%)
                </p>
            </div>

            {/* Main Claim Button Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
                <div className="text-center space-y-2">
                    <p className="text-holi-grey/60 uppercase tracking-[0.3em] font-black text-[10px]">Appuie pour déclarer</p>
                    <p className="text-3xl font-heading font-black text-holi-navy italic tracking-tighter uppercase">RDV Qualifié</p>
                </div>

                <div className="relative" ref={buttonRef}>
                    <div className={cn(
                        "absolute -inset-4 bg-holi-orange/10 rounded-full animate-pulse transition-opacity duration-500",
                        claiming ? "opacity-0" : "opacity-100"
                    )} />

                    <button
                        onClick={handleClaim}
                        disabled={claiming || summary?.status !== "OPEN"}
                        className={cn(
                            "relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-90 shadow-2xl overflow-hidden",
                            summary?.status === "OPEN"
                                ? "bg-gradient-to-b from-holi-orange to-holi-red shadow-holi-orange/40 text-white cursor-pointer"
                                : "bg-neutral-200 shadow-none text-neutral-400 cursor-not-allowed"
                        )}
                    >
                        <PlusCircle className={cn("w-16 h-16", claiming && "animate-spin")} />
                        <span className="font-heading font-black text-xl tracking-tighter uppercase">Boom !</span>

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

            {/* Leaderboard Section */}
            <div className="card p-0 overflow-hidden shadow-lg border-holi-navy/5">
                <div className="p-4 bg-holi-navy/[0.02] flex items-center justify-between border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-holi-yellow" />
                        <h3 className="font-heading font-black uppercase tracking-wider text-sm text-holi-navy">Leaderboard RDVs</h3>
                    </div>
                    <p className="text-[10px] text-holi-grey font-bold">Total : {formatCents(summary?.businessTotalCents || 0)}</p>
                </div>

                <div className="divide-y divide-black/5">
                    {summary?.leaderboard?.map((p: any, idx: number) => (
                        <div key={p.id} className={cn(
                            "flex flex-col p-4",
                            p.id === participant?.id && "bg-holi-orange/5"
                        )}>
                            <div className="flex items-center justify-between mb-2">
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
                                    <p className="font-black text-holi-dark">{p.score} <span className="text-[10px] text-holi-grey font-bold uppercase">RDV</span></p>
                                </div>
                            </div>
                            {/* Mini Progress Bar for each user */}
                            <div className="ml-10 h-1 bg-black/5 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        idx === 0 ? "bg-holi-orange" : "bg-holi-blue"
                                    )}
                                    style={{ width: `${Math.min((p.score / objective) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mes RDV Section */}
            {myClaims.length > 0 && (
                <div className="card p-0 overflow-hidden shadow-lg border-holi-navy/5">
                    <button
                        onClick={() => setShowMyClaims(!showMyClaims)}
                        className="w-full p-4 bg-holi-navy/[0.02] flex items-center justify-between border-b border-black/5 hover:bg-holi-navy/[0.04] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <CalendarCheck className="w-5 h-5 text-holi-orange" />
                            <h3 className="font-heading font-black uppercase tracking-wider text-sm text-holi-navy">Mes RDV ({myClaims.filter((c: any) => c.status === 'VALID').length})</h3>
                        </div>
                        <span className="text-xs text-holi-grey font-bold">{showMyClaims ? "Masquer ▲" : "Voir ▼"}</span>
                    </button>

                    {showMyClaims && (
                        <div className="divide-y divide-black/5">
                            {myClaims.map((claim: any) => {
                                const elapsed = Date.now() - new Date(claim.createdAt).getTime();
                                const canSelfCancel = claim.status === 'VALID' && elapsed < SELF_CANCEL_WINDOW_MS;
                                const remainingMin = Math.max(0, Math.ceil((SELF_CANCEL_WINDOW_MS - elapsed) / 60000));

                                return (
                                    <div key={claim.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-sm font-medium">
                                                {new Date(claim.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                claim.status === "VALID" ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                                            )}>
                                                {claim.status === "VALID" ? "✓ Validé" : "✗ Annulé"}
                                            </span>
                                            {claim.status === "CANCELLED" && claim.cancelReason && (
                                                <span className="text-[11px] text-neutral-400 italic flex items-center gap-1">
                                                    <MessageSquare className="w-3 h-3" /> {claim.cancelReason}
                                                </span>
                                            )}
                                        </div>
                                        {canSelfCancel && (
                                            <button
                                                onClick={() => { setSelfCancelling(claim); setSelfCancelReason(""); }}
                                                className="text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 transition-all flex items-center gap-1"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Retirer ({remainingMin}min)
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

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

            {/* ═══════ RAPID DECLARATION WARNING ("Double Kill") ═══════ */}
            {rapidWarning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRapidWarning(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-float" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                            <div className="p-4 bg-orange-50 rounded-full">
                                <Flame className="w-10 h-10 text-holi-orange animate-pulse" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-heading font-black text-holi-orange uppercase italic">
                                🔥 Double Kill !
                            </h3>
                            <p className="text-holi-grey text-sm font-medium leading-relaxed">
                                Vous avez déclaré <span className="font-bold text-holi-dark">2 RDV en moins de 2 minutes</span>.<br />
                                C&apos;est soit une belle performance, un oubli, ou une erreur.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-1">
                            <button
                                onClick={() => setRapidWarning(null)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-black uppercase bg-gradient-to-r from-holi-orange to-holi-red text-white shadow-lg shadow-holi-orange/30 transition-all hover:shadow-xl hover:shadow-holi-orange/40 active:scale-95"
                            >
                                <Flame className="w-5 h-5" />
                                Oui, je suis en feu ! 🔥
                            </button>
                            <button
                                onClick={handleRapidCancel}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold uppercase border-2 border-neutral-200 text-neutral-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <XCircle className="w-4 h-4" />
                                Oups, c&apos;est une erreur — Annuler le dernier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ SELF-CANCEL MODAL ═══════ */}
            {selfCancelling && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelfCancelling(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-float" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                            <div className="p-4 bg-red-50 rounded-full">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-heading font-black text-red-600 uppercase italic">Retirer ce RDV</h3>
                            <p className="text-holi-grey text-sm font-medium">
                                RDV déclaré à <span className="font-bold text-holi-dark">
                                    {new Date(selfCancelling.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-600">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            Le RDV sera retiré du compteur et du leaderboard.
                        </div>

                        <div>
                            <label className="text-xs font-black uppercase text-holi-grey mb-1.5 block">
                                Raison <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                className="input-field resize-none text-sm"
                                rows={2}
                                placeholder="ex: Doublon, erreur de saisie..."
                                value={selfCancelReason}
                                onChange={(e) => setSelfCancelReason(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={confirmSelfCancel}
                                disabled={selfCancelLoading || !selfCancelReason.trim()}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black uppercase transition-all",
                                    selfCancelReason.trim()
                                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                )}
                            >
                                {selfCancelLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                Confirmer
                            </button>
                            <button
                                onClick={() => setSelfCancelling(null)}
                                className="flex-1 btn-ghost text-sm font-black uppercase"
                            >
                                Retour
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes shake-short {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(-2px, 2px); }
                    50% { transform: translate(2px, -2px); }
                    75% { transform: translate(-2px, -2px); }
                }
                .animate-shake-short {
                    animation: shake-short 0.2s ease-in-out;
                }
            `}</style>
        </div>
    );
}
