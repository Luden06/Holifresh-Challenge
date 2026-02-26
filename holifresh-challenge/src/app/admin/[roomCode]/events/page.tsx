"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    Download,
    RotateCcw,
    UserRoundPen,
    Calendar,
    User,
    CheckCircle2,
    XCircle,
    X,
    AlertTriangle,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { formatCents, cn } from "@/lib/utils";

export default function AdminEventsPage() {
    const { roomCode } = useParams();
    const roomId = roomCode;
    const [events, setEvents] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Rename modal state
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

    // Cancel modal state
    const [cancellingClaim, setCancellingClaim] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);

    async function fetchData() {
        try {
            const [eventsRes, summaryRes] = await Promise.all([
                fetch(`/api/rooms/${roomId}/events`),
                fetch(`/api/rooms/${roomId}/summary`)
            ]);

            if (eventsRes.ok && summaryRes.ok) {
                setEvents(await eventsRes.json());
                setSummary(await summaryRes.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [roomId]);

    async function confirmCancel() {
        if (!cancellingClaim || !cancelReason.trim()) return;
        setCancelLoading(true);
        try {
            const res = await fetch(`/api/rooms/${roomId}/claims/${cancellingClaim.id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: cancelReason.trim() }),
            });
            if (res.ok) {
                fetchData();
                setCancellingClaim(null);
                setCancelReason("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCancelLoading(false);
        }
    }

    async function renameParticipant(participantId: string, oldName: string) {
        const name = prompt("Nouveau nom pour ce participant :", oldName);
        if (!name || name === oldName) return;

        try {
            const res = await fetch(`/api/rooms/${roomId}/participants/${participantId}/rename`, {
                method: "POST",
                body: JSON.stringify({ displayName: name }),
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{summary?.roomName}</h1>
                        <p className="text-neutral-400 text-sm">Modération et historique des événements</p>
                    </div>
                </div>
                <a
                    href={`/api/rooms/${roomCode}/export`}
                    className="btn-ghost text-sm py-2 px-4 gap-2"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </a>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Total RDV</p>
                    <p className="text-2xl font-bold text-primary">{summary?.totals}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Business</p>
                    <p className="text-2xl font-bold text-accent">{formatCents(summary?.businessTotalCents || 0)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Objectif</p>
                    <p className="text-2xl font-bold">{summary?.objectiveTotal}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Obj. Signatures</p>
                    <p className="text-2xl font-bold text-accent">{summary?.signaturesGoal}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Progression</p>
                    <p className="text-2xl font-bold">{Math.round(summary?.objectiveProgress || 0)}%</p>
                </div>
            </div>

            {/* Events Table */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold px-2">Derniers 100 événements</h2>

                <div className="card p-0 overflow-hidden border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs text-neutral-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Horodatage</th>
                                    <th className="px-6 py-4 font-semibold">Participant</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {events.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                            Aucun événement enregistré.
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event) => (
                                        <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                                                    <span className="text-sm">
                                                        {new Date(event.createdAt).toLocaleTimeString("fr-FR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit"
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-neutral-500" />
                                                    <span className="text-sm font-medium">{event.participant.displayName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {event.status === "VALID" ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-accent/10 text-accent">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            VALID
                                                        </span>
                                                    ) : (
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                                            event.cancelledBy === "self" ? "bg-holi-blue/10 text-holi-blue" : "bg-danger/10 text-danger"
                                                        )}>
                                                            <XCircle className="w-3 h-3" />
                                                            {event.cancelledBy === "self" ? "AUTO-ANNULÉ" : "ANNULÉ (ADMIN)"}
                                                        </span>
                                                    )}
                                                    {event.status === "CANCELLED" && event.cancelReason && (
                                                        <div className="flex items-start gap-1.5 text-[11px] text-neutral-400 italic max-w-[250px]">
                                                            <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                            <span className="line-clamp-2">{event.cancelReason}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => renameParticipant(event.participant.id, event.participant.displayName)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-400 hover:text-holi-blue hover:bg-holi-blue/10 transition-all"
                                                        title="Renommer participant"
                                                    >
                                                        <UserRoundPen className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Renommer</span>
                                                    </button>
                                                    {event.status === "VALID" && (
                                                        <button
                                                            onClick={() => { setCancellingClaim(event); setCancelReason(""); }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                                            title="Annuler le RDV"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">Annuler</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {cancellingClaim && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCancellingClaim(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-float" onClick={(e) => e.stopPropagation()}>
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div className="p-4 bg-red-50 rounded-full">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        {/* Title & Context */}
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-heading font-black text-red-600 uppercase italic">
                                Annuler ce RDV
                            </h3>
                            <p className="text-holi-grey text-sm font-medium">
                                RDV déclaré par <span className="font-bold text-holi-dark">{cancellingClaim.participant.displayName}</span> à{" "}
                                <span className="font-bold text-holi-dark">
                                    {new Date(cancellingClaim.createdAt).toLocaleTimeString("fr-FR", {
                                        hour: "2-digit", minute: "2-digit"
                                    })}
                                </span>
                            </p>
                        </div>

                        {/* Warning */}
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-600">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            Le RDV sera retiré du compteur et du leaderboard.
                        </div>

                        {/* Reason Field */}
                        <div>
                            <label className="text-xs font-black uppercase text-holi-grey mb-1.5 block">
                                Raison de l&apos;annulation <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                className="input-field resize-none text-sm"
                                rows={3}
                                placeholder="ex: Doublon, erreur de saisie, faux RDV..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={confirmCancel}
                                disabled={cancelLoading || !cancelReason.trim()}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black uppercase transition-all",
                                    cancelReason.trim()
                                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                )}
                            >
                                {cancelLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                Confirmer l&apos;annulation
                            </button>
                            <button
                                onClick={() => setCancellingClaim(null)}
                                className="flex-1 btn-ghost text-sm font-black uppercase"
                            >
                                Retour
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
