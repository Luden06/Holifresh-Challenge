"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Download,
    RotateCcw,
    UserRoundPen,
    Calendar,
    User,
    CheckCircle2,
    XCircle,
    Hash
} from "lucide-react";
import Link from "next/link";
import { formatCents, cn } from "@/lib/utils";

export default function AdminEventsPage() {
    const { roomId } = useParams();
    const [events, setEvents] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Rename modal state
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

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
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [roomId]);

    async function cancelClaim(claimId: string) {
        if (!confirm("Voulez-vous vraiment annuler ce RDV ?")) return;
        try {
            const res = await fetch(`/api/rooms/${roomId}/claims/${claimId}/cancel`, {
                method: "POST",
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
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
                    href={`/api/rooms/${roomId}/export`}
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
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                                    event.status === "VALID" ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                                                )}>
                                                    {event.status === "VALID" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => renameParticipant(event.participant.id, event.participant.displayName)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                                        title="Renommer participant"
                                                    >
                                                        <UserRoundPen className="w-4 h-4" />
                                                    </button>
                                                    {event.status === "VALID" && (
                                                        <button
                                                            onClick={() => cancelClaim(event.id)}
                                                            className="p-2 hover:bg-danger/10 rounded-lg text-neutral-400 hover:text-danger transition-colors"
                                                            title="Annuler le RDV"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
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
        </div>
    );
}
