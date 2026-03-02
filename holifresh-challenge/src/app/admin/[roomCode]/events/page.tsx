"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    Download,
    UserRoundPen,
    Calendar,
    User,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    MessageSquare,
    Zap,
    Plus,
    Power,
    Trash2,
    Clock,
    Sparkles,
    Gift,
    Coins
} from "lucide-react";
import Link from "next/link";
import { formatCents, cn } from "@/lib/utils";

export default function AdminEventsPage() {
    const { roomCode } = useParams();
    const roomId = roomCode;
    const [events, setEvents] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [boosts, setBoosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Rename modal state
    const [renamingParticipant, setRenamingParticipant] = useState<{ id: string, name: string } | null>(null);
    const [newName, setNewName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);

    // Cancel modal state
    const [cancellingClaim, setCancellingClaim] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);

    // Create boost modal state
    const [showCreateBoost, setShowCreateBoost] = useState(false);
    const [newBoost, setNewBoost] = useState({
        label: "",
        type: "MULTIPLIER" as "MULTIPLIER" | "FLAT_BONUS",
        multiplier: "2",
        bonusCents: "2500",
        useSchedule: false,
        startAt: "",
        endAt: "",
    });
    const [createBoostLoading, setCreateBoostLoading] = useState(false);

    // Bonus direct state
    const [activeTab, setActiveTab] = useState<"BOOSTS" | "BONUS">("BOOSTS");
    const [newBonus, setNewBonus] = useState({
        participantId: "ALL",
        valueCents: "",
        reason: ""
    });
    const [createBonusLoading, setCreateBonusLoading] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    async function fetchData() {
        try {
            const [eventsRes, summaryRes, boostsRes] = await Promise.all([
                fetch(`/api/rooms/${roomId}/events`),
                fetch(`/api/rooms/${roomId}/summary`),
                fetch(`/api/rooms/${roomId}/boosts`),
            ]);

            if (eventsRes.ok && summaryRes.ok) {
                setEvents(await eventsRes.json());
                setSummary(await summaryRes.json());
            }
            if (boostsRes.ok) {
                setBoosts(await boostsRes.json());
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

    function openRename(participantId: string, displayName: string) {
        setRenamingParticipant({ id: participantId, name: displayName });
        setNewName(displayName);
    }

    async function confirmRename() {
        if (!renamingParticipant || !newName.trim() || newName.trim() === renamingParticipant.name) return;
        setRenameLoading(true);
        try {
            const res = await fetch(`/api/rooms/${roomId}/participants/${renamingParticipant.id}/rename`, {
                method: "POST",
                body: JSON.stringify({ displayName: newName.trim() }),
            });
            if (res.ok) {
                fetchData();
                setRenamingParticipant(null);
                setNewName("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRenameLoading(false);
        }
    }

    async function toggleBoost(boostId: string, currentActive: boolean) {
        try {
            await fetch(`/api/rooms/${roomId}/boosts/${boostId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentActive }),
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteBoost(boostId: string) {
        try {
            await fetch(`/api/rooms/${roomId}/boosts/${boostId}`, { method: "DELETE" });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    async function createBoost() {
        setCreateBoostLoading(true);
        try {
            const payload: any = {
                label: newBoost.label,
                type: newBoost.type,
                isActive: false,
            };
            if (newBoost.type === "MULTIPLIER") {
                payload.multiplier = parseFloat(newBoost.multiplier);
            } else {
                payload.bonusCents = parseInt(newBoost.bonusCents);
            }
            if (newBoost.useSchedule) {
                if (newBoost.startAt) payload.startAt = new Date(newBoost.startAt).toISOString();
                if (newBoost.endAt) payload.endAt = new Date(newBoost.endAt).toISOString();
            }

            const res = await fetch(`/api/rooms/${roomId}/boosts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowCreateBoost(false);
                setNewBoost({ label: "", type: "MULTIPLIER", multiplier: "2", bonusCents: "2500", useSchedule: false, startAt: "", endAt: "" });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreateBoostLoading(false);
        }
    }

    async function loadTemplates() {
        setLoadingTemplates(true);
        try {
            const templates = [
                { label: "⚡ Mini-défi matin", type: "FLAT_BONUS", bonusCents: 2500, isActive: false },
                { label: "🤜🤛 High-Five", type: "FLAT_BONUS", bonusCents: 1500, isActive: false },
                { label: "🏷️ Machine à RDV", type: "MULTIPLIER", multiplier: 2, isActive: false },
                { label: "🌅 Last Call", type: "MULTIPLIER", multiplier: 2, isActive: false },
            ];
            for (const t of templates) {
                await fetch(`/api/rooms/${roomId}/boosts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(t),
                });
            }
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTemplates(false);
        }
    }

    async function submitBonus() {
        if (!newBonus.valueCents || !newBonus.reason) return;
        setCreateBonusLoading(true);
        try {
            const val = parseFloat(newBonus.valueCents.replace(',', '.'));
            if (isNaN(val)) return;

            const payload = {
                participantId: newBonus.participantId,
                valueCents: Math.round(val * 100),
                reason: newBonus.reason,
            };

            const res = await fetch(`/api/rooms/${roomId}/bonus`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setNewBonus({ participantId: "ALL", valueCents: "", reason: "" });
                fetchData();
                setActiveTab("BOOSTS");
                window.alert("✅ Bonus Direct ajouté avec succès ! La cagnotte a été mise à jour.");
            } else {
                window.alert("❌ Erreur lors de l'ajout du bonus.");
            }
        } catch (err) {
            console.error(err);
            window.alert("❌ Erreur de connexion au serveur.");
        } finally {
            setCreateBonusLoading(false);
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
                        <p className="text-neutral-400 text-sm">Modération, boosts et historique</p>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Total RDV</p>
                    <p className="text-2xl font-bold text-primary">{summary?.totals}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Business</p>
                    <p className="text-2xl font-bold text-accent">{formatCents(summary?.businessTotalCents || 0)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Cagnotte Équipe</p>
                    <p className="text-2xl font-bold text-holi-orange">{formatCents(summary?.teamCagnotteCents || 0)}</p>
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

            {/* ═══════ BOOSTS & BONUS MANAGEMENT ═══════ */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex bg-neutral-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("BOOSTS")}
                            className={cn(
                                "px-4 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2",
                                activeTab === "BOOSTS" ? "bg-white shadow-sm text-holi-orange" : "text-neutral-500 hover:text-neutral-700 hover:bg-black/5"
                            )}
                        >
                            <Zap className="w-4 h-4" /> Boosts Actifs
                        </button>
                        <button
                            onClick={() => setActiveTab("BONUS")}
                            className={cn(
                                "px-4 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2",
                                activeTab === "BONUS" ? "bg-white shadow-sm text-holi-orange" : "text-neutral-500 hover:text-neutral-700 hover:bg-black/5"
                            )}
                        >
                            <Gift className="w-4 h-4" /> Bonus Direct
                        </button>
                    </div>

                    {activeTab === "BOOSTS" && (
                        <div className="flex items-center gap-2">
                            {boosts.length === 0 && (
                                <button
                                    onClick={loadTemplates}
                                    disabled={loadingTemplates}
                                    className="btn-ghost text-xs py-2 px-4 text-neutral-500 font-bold flex items-center gap-1.5 hover:bg-neutral-100"
                                >
                                    <Sparkles className="w-4 h-4" /> Templates
                                </button>
                            )}
                            <button
                                onClick={() => setShowCreateBoost(true)}
                                className="btn-ghost text-xs py-2 px-4 text-holi-orange hover:bg-holi-orange/10 border-holi-orange/20 uppercase font-black flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Nouveau Boost
                            </button>
                        </div>
                    )}
                </div>

                {activeTab === "BOOSTS" && (
                    <>
                        {boosts.length === 0 ? (
                            <div className="card text-center py-8 text-neutral-400 text-sm">
                                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                Aucun boost configuré. Créez-en un pour booster la motivation ou chargez les templates !
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {boosts.map((boost) => (
                                    <div key={boost.id} className={cn(
                                        "card p-4 border-2 transition-all",
                                        boost.effectivelyActive
                                            ? "border-holi-orange/40 bg-holi-orange/5 shadow-lg shadow-holi-orange/10"
                                            : "border-transparent"
                                    )}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-sm truncate">{boost.label}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        boost.type === "MULTIPLIER"
                                                            ? "bg-holi-blue/10 text-holi-blue"
                                                            : "bg-holi-orange/10 text-holi-orange"
                                                    )}>
                                                        {boost.type === "MULTIPLIER"
                                                            ? `×${boost.multiplier}`
                                                            : `+${formatCents(boost.bonusCents)}`
                                                        }
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        boost.effectivelyActive
                                                            ? "bg-green-100 text-green-600"
                                                            : boost.isActive
                                                                ? "bg-yellow-100 text-yellow-600"
                                                                : "bg-neutral-100 text-neutral-400"
                                                    )}>
                                                        {boost.effectivelyActive ? "🟢 ACTIF" : boost.isActive ? "⏳ PROGRAMMÉ" : "⚪ INACTIF"}
                                                    </span>
                                                </div>
                                                {(boost.startAt || boost.endAt) && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-neutral-400">
                                                        <Clock className="w-3 h-3" />
                                                        {boost.startAt && <span>{new Date(boost.startAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>}
                                                        {boost.startAt && boost.endAt && <span>→</span>}
                                                        {boost.endAt && <span>{new Date(boost.endAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleBoost(boost.id, boost.isActive)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all",
                                                    boost.isActive
                                                        ? "bg-red-50 text-red-500 hover:bg-red-100 border border-red-200"
                                                        : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                                                )}
                                            >
                                                <Power className="w-3.5 h-3.5" />
                                                {boost.isActive ? "Désactiver" : "Activer"}
                                            </button>
                                            <button
                                                onClick={() => deleteBoost(boost.id)}
                                                className="p-2 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                title="Supprimer le boost"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* BONUS DIRECT TAB */}
                {activeTab === "BONUS" && (
                    <div className="card p-6 border-2 border-holi-orange/20 bg-gradient-to-br from-white to-holi-orange/5">
                        <div className="max-w-xl mx-auto space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-holi-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Gift className="w-6 h-6 text-holi-orange" />
                                </div>
                                <h3 className="text-lg font-bold">Cagnotte Drop</h3>
                                <p className="text-sm text-neutral-500">Ajouter directement un montant à la cagnotte (individuel ou collectif) sans qu'un RDV en soit la cause.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Participant(s) Ciblé(s)</label>
                                <select
                                    className="input w-full"
                                    value={newBonus.participantId}
                                    onChange={(e) => setNewBonus({ ...newBonus, participantId: e.target.value })}
                                >
                                    <option value="ALL">🌟 Toute l'équipe (Bonus Collectif)</option>
                                    <optgroup label="Participants">
                                        {summary?.leaderboard?.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.displayName}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Montant (€)</label>
                                    <input
                                        type="number"
                                        placeholder="15.00"
                                        className="input w-full"
                                        value={newBonus.valueCents}
                                        onChange={(e) => setNewBonus({ ...newBonus, valueCents: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Raison / Titre</label>
                                    <input
                                        type="text"
                                        placeholder="Palier d'équipe atteint !"
                                        className="input w-full"
                                        value={newBonus.reason}
                                        onChange={(e) => setNewBonus({ ...newBonus, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={submitBonus}
                                disabled={createBonusLoading || !newBonus.valueCents || !newBonus.reason}
                                className="btn-primary w-full py-3 mt-4"
                            >
                                {createBonusLoading ? "Ajout en cours..." : "Valider le Bonus Direct 🚀"}
                            </button>
                        </div>
                    </div>
                )}
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
                                                    {event.type === 'BONUS' ? (
                                                        <Gift className="w-3.5 h-3.5 text-holi-orange" />
                                                    ) : (
                                                        <User className="w-3.5 h-3.5 text-neutral-500" />
                                                    )}
                                                    <span className="text-sm font-medium">{event.participant?.displayName || "—"}</span>
                                                    {event.type === 'BONUS' && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-holi-orange/10 text-holi-orange">
                                                            Bonus Direct
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {event.status === "VALID" ? (
                                                            event.type === 'BONUS' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-holi-orange/10 text-holi-orange">
                                                                    <Coins className="w-3 h-3" />
                                                                    VALIDÉ (+{formatCents(event.valueCents || 0)})
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-accent/10 text-accent">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    VALIDÉ
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                                                event.cancelledBy === "self" ? "bg-holi-blue/10 text-holi-blue" : "bg-danger/10 text-danger"
                                                            )}>
                                                                <XCircle className="w-3 h-3" />
                                                                {event.cancelledBy === "self" ? "AUTO-ANNULÉ" : "ANNULÉ (ADMIN)"}
                                                            </span>
                                                        )}
                                                        {event.type !== 'BONUS' && event.claimBoosts?.length > 0 && event.claimBoosts.map((cb: any, i: number) => (
                                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-holi-orange/10 text-holi-orange">
                                                                <Zap className="w-2.5 h-2.5" />
                                                                {cb.boost.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {event.cancelReason && (
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
                                                        onClick={() => openRename(event.participant.id, event.participant.displayName)}
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
                                                            title="Annuler"
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

            {/* ═══════ CREATE BOOST MODAL ═══════ */}
            {showCreateBoost && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateBoost(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-float" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                            <div className="p-4 bg-holi-orange/10 rounded-full">
                                <Zap className="w-8 h-8 text-holi-orange" />
                            </div>
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-heading font-black text-holi-dark uppercase italic">Nouveau Boost</h3>
                            <p className="text-holi-grey text-sm">Configurez un boost pour motiver l&apos;équipe</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Label (avec emoji)</label>
                                <input
                                    type="text"
                                    className="input-field text-sm font-bold"
                                    placeholder="ex: 🌅 Last Call, 🕵️ Stand Voisin"
                                    value={newBoost.label}
                                    onChange={(e) => setNewBoost({ ...newBoost, label: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-2 block">Type de boost</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewBoost({ ...newBoost, type: "MULTIPLIER" })}
                                        className={cn(
                                            "p-3 rounded-xl border-2 text-center transition-all text-sm font-bold",
                                            newBoost.type === "MULTIPLIER"
                                                ? "border-holi-blue bg-holi-blue/5 text-holi-blue"
                                                : "border-neutral-200 text-neutral-400 hover:border-neutral-300"
                                        )}
                                    >
                                        ×2 Multiplicateur
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewBoost({ ...newBoost, type: "FLAT_BONUS" })}
                                        className={cn(
                                            "p-3 rounded-xl border-2 text-center transition-all text-sm font-bold",
                                            newBoost.type === "FLAT_BONUS"
                                                ? "border-holi-orange bg-holi-orange/5 text-holi-orange"
                                                : "border-neutral-200 text-neutral-400 hover:border-neutral-300"
                                        )}
                                    >
                                        +€ Bonus fixe
                                    </button>
                                </div>
                            </div>

                            {newBoost.type === "MULTIPLIER" ? (
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Multiplicateur</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        className="input-field font-bold text-center text-lg"
                                        value={newBoost.multiplier}
                                        onChange={(e) => setNewBoost({ ...newBoost, multiplier: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Bonus (€)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        className="input-field font-bold text-center text-lg"
                                        value={parseInt(newBoost.bonusCents) / 100}
                                        onChange={(e) => setNewBoost({ ...newBoost, bonusCents: (Math.round(parseFloat(e.target.value) * 100)).toString() })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newBoost.useSchedule}
                                        onChange={(e) => setNewBoost({ ...newBoost, useSchedule: e.target.checked })}
                                        className="rounded border-neutral-300"
                                    />
                                    <span className="text-xs font-black uppercase text-holi-grey">Planifier une période</span>
                                </label>

                                {newBoost.useSchedule && (
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Début</label>
                                            <input
                                                type="datetime-local"
                                                className="input-field text-xs"
                                                value={newBoost.startAt}
                                                onChange={(e) => setNewBoost({ ...newBoost, startAt: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 block mb-1">Fin</label>
                                            <input
                                                type="datetime-local"
                                                className="input-field text-xs"
                                                value={newBoost.endAt}
                                                onChange={(e) => setNewBoost({ ...newBoost, endAt: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={createBoost}
                                disabled={createBoostLoading || !newBoost.label.trim()}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black uppercase transition-all",
                                    newBoost.label.trim()
                                        ? "bg-gradient-to-r from-holi-orange to-holi-red text-white shadow-lg shadow-holi-orange/20"
                                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                )}
                            >
                                {createBoostLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                Créer le Boost
                            </button>
                            <button
                                onClick={() => setShowCreateBoost(false)}
                                className="flex-1 btn-ghost text-sm font-black uppercase"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renamingParticipant && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRenamingParticipant(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-float" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                            <div className="p-4 bg-holi-blue/10 rounded-full">
                                <UserRoundPen className="w-8 h-8 text-holi-blue" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-heading font-black text-holi-dark uppercase italic">Renommer le participant</h3>
                            <p className="text-holi-grey text-sm font-medium">Nom actuel : <span className="font-bold text-holi-dark">{renamingParticipant.name}</span></p>
                        </div>
                        <div>
                            <label className="text-xs font-black uppercase text-holi-grey mb-1.5 block">Nouveau nom</label>
                            <input type="text" className="input-field text-sm font-bold" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmRename()} autoFocus />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <button onClick={confirmRename} disabled={renameLoading || !newName.trim() || newName.trim() === renamingParticipant.name} className={cn("flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black uppercase transition-all", newName.trim() && newName.trim() !== renamingParticipant.name ? "bg-holi-blue hover:bg-holi-blue/90 text-white shadow-lg shadow-holi-blue/20" : "bg-neutral-200 text-neutral-400 cursor-not-allowed")}>
                                {renameLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserRoundPen className="w-4 h-4" />}
                                Renommer
                            </button>
                            <button onClick={() => setRenamingParticipant(null)} className="flex-1 btn-ghost text-sm font-black uppercase">Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancellingClaim && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCancellingClaim(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-float" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                            <div className="p-4 bg-red-50 rounded-full">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-heading font-black text-red-600 uppercase italic">Annuler ce RDV</h3>
                            <p className="text-holi-grey text-sm font-medium">
                                RDV déclaré par <span className="font-bold text-holi-dark">{cancellingClaim.participant.displayName}</span> à{" "}
                                <span className="font-bold text-holi-dark">{new Date(cancellingClaim.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-600">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            Le RDV sera retiré du compteur et du leaderboard.
                        </div>
                        <div>
                            <label className="text-xs font-black uppercase text-holi-grey mb-1.5 block">Raison de l&apos;annulation <span className="text-red-400">*</span></label>
                            <textarea className="input-field resize-none text-sm" rows={3} placeholder="ex: Doublon, erreur de saisie, faux RDV..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} autoFocus />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <button onClick={confirmCancel} disabled={cancelLoading || !cancelReason.trim()} className={cn("flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black uppercase transition-all", cancelReason.trim() ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" : "bg-neutral-200 text-neutral-400 cursor-not-allowed")}>
                                {cancelLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Confirmer l&apos;annulation
                            </button>
                            <button onClick={() => setCancellingClaim(null)} className="flex-1 btn-ghost text-sm font-black uppercase">Retour</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
