"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Plus, DoorOpen, DoorClosed, Link as LinkIcon, ExternalLink, Pencil, Archive, X, Check, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatCents } from "@/lib/utils";

// ─── Reusable Confirmation Modal ────────────────────────────────────────────
function ConfirmModal({
    open,
    title,
    message,
    icon,
    confirmLabel,
    cancelLabel = "Annuler",
    variant = "default",
    onConfirm,
    onCancel,
    loading = false,
}: {
    open: boolean;
    title: string;
    message: string;
    icon: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}) {
    if (!open) return null;

    const isDanger = variant === "danger";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-float" onClick={(e) => e.stopPropagation()}>
                {/* Icon */}
                <div className="flex justify-center">
                    <div className={cn(
                        "p-4 rounded-full",
                        isDanger ? "bg-red-50" : "bg-holi-orange/10"
                    )}>
                        {icon}
                    </div>
                </div>

                {/* Title & Message */}
                <div className="text-center space-y-2">
                    <h3 className={cn(
                        "text-xl font-heading font-black uppercase italic",
                        isDanger ? "text-red-600" : "text-holi-dark"
                    )}>
                        {title}
                    </h3>
                    <p className="text-holi-grey text-sm font-medium leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Danger warning bar */}
                {isDanger && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs font-bold text-red-600">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Cette action est irréversible.
                    </div>
                )}

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black uppercase transition-all",
                            isDanger
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                                : "btn-primary"
                        )}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : null}
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 btn-ghost text-sm font-black uppercase"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────
export default function AdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [error, setError] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    const [rooms, setRooms] = useState<any[]>([]);
    const [editingRoom, setEditingRoom] = useState<any | null>(null);
    const [newRoom, setNewRoom] = useState({
        name: "",
        objectiveTotal: "50",
        rdvValueCents: "1000",
        signaturesGoal: "15",
        joinCode: ""
    });

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        icon: React.ReactNode;
        confirmLabel: string;
        variant: "default" | "danger";
        onConfirm: () => void;
    }>({
        open: false, title: "", message: "", icon: null,
        confirmLabel: "", variant: "default", onConfirm: () => { },
    });

    const router = useRouter();

    // Auto-login: check if admin cookie is still valid on page load
    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/rooms");
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                    setIsLoggedIn(true);
                }
            } catch (err) {
                // Cookie expired or not set, show login form
            } finally {
                setCheckingSession(false);
            }
        }
        checkSession();
    }, []);

    async function fetchRooms() {
        try {
            const res = await fetch("/api/rooms");
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                body: JSON.stringify({ code: adminCode }),
            });

            if (res.ok) {
                setIsLoggedIn(true);
                fetchRooms();
            } else {
                setError("Code administrateur invalide");
            }
        } catch (err) {
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    }

    async function createRoom(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                body: JSON.stringify(newRoom),
            });

            if (res.ok) {
                const room = await res.json();
                setRooms([room, ...rooms]);
                setNewRoom({ name: "", objectiveTotal: "50", rdvValueCents: "1000", signaturesGoal: "15", joinCode: "" });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function toggleRoom(roomId: string, action: 'open' | 'close') {
        try {
            const res = await fetch(`/api/rooms/${roomId}/${action}`, { method: "POST" });
            if (res.ok) {
                const updated = await res.json();
                setRooms(rooms.map(r => r.id === roomId ? updated : r));
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function saveEdit() {
        if (!editingRoom) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/rooms/${editingRoom.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingRoom.name,
                    objectiveTotal: editingRoom.objectiveTotal,
                    rdvValueCents: editingRoom.rdvValueCents,
                    signaturesGoal: editingRoom.signaturesGoal,
                    joinCode: editingRoom.joinCode,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setRooms(rooms.map(r => r.id === updated.id ? updated : r));
                setEditingRoom(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function requestArchive(room: any) {
        setConfirmModal({
            open: true,
            title: "Archiver la Room",
            message: `La room "${room.name}" sera masquée de la liste principale. Les données sont conservées et vous pourrez toujours la consulter via le filtre "Voir archivées".`,
            icon: <Archive className="w-8 h-8 text-holi-orange" />,
            confirmLabel: "Archiver",
            variant: "default",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
                    if (res.ok) {
                        const updated = await res.json();
                        setRooms(rooms.map(r => r.id === room.id ? updated : r));
                    }
                } catch (err) {
                    console.error(err);
                }
                setConfirmModal(prev => ({ ...prev, open: false }));
            },
        });
    }

    function requestDelete(room: any) {
        setConfirmModal({
            open: true,
            title: "Supprimer la Room",
            message: `Vous êtes sur le point de supprimer définitivement la room "${room.name}" ainsi que TOUS ses participants et déclarations. Cette action ne peut pas être annulée.`,
            icon: <Trash2 className="w-8 h-8 text-red-500" />,
            confirmLabel: "Supprimer définitivement",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/rooms/${room.id}?permanent=true`, { method: "DELETE" });
                    if (res.ok) {
                        setRooms(rooms.filter(r => r.id !== room.id));
                    }
                } catch (err) {
                    console.error(err);
                }
                setConfirmModal(prev => ({ ...prev, open: false }));
            },
        });
    }

    const activeRooms = rooms.filter(r => r.status !== "ARCHIVED");
    const archivedRooms = rooms.filter(r => r.status === "ARCHIVED");
    const displayedRooms = showArchived ? rooms : activeRooms;

    if (checkingSession) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-holi-orange/30 border-t-holi-orange rounded-full animate-spin mx-auto"></div>
                    <p className="text-holi-grey font-bold">Vérification de la session...</p>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="card max-w-md w-full animate-float">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-holi-orange/10 rounded-full">
                            <Lock className="w-8 h-8 text-holi-orange" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-heading font-black text-center mb-2 text-holi-dark uppercase tracking-tight">Administration</h1>
                    <p className="text-holi-grey text-center mb-8">Entrez le code secret pour continuer</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Code Admin"
                            className="input-field text-center text-xl tracking-widest"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            required
                        />
                        {error && <p className="text-holi-pink text-sm text-center font-bold italic">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? "Connexion..." : "Se connecter"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-black text-holi-dark uppercase italic tracking-tighter">Dashboard Admin</h1>
                    <p className="text-holi-grey font-bold">Gérez vos événements et suivez les performances</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Room Form */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <h2 className="text-xl font-heading font-black mb-6 flex items-center gap-2 text-holi-orange uppercase italic">
                            <Plus className="w-5 h-5" />
                            Nouvelle Room
                        </h2>
                        <form onSubmit={createRoom} className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Nom de l&apos;événement</label>
                                <input
                                    type="text"
                                    placeholder="ex: Kickoff Q1 2026"
                                    className="input-field"
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Objectif (RDV)</label>
                                    <input
                                        type="number"
                                        className="input-field font-bold"
                                        value={newRoom.objectiveTotal}
                                        onChange={(e) => setNewRoom({ ...newRoom, objectiveTotal: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Valeur RDV (€)</label>
                                    <input
                                        type="number"
                                        className="input-field font-bold"
                                        value={isNaN(parseInt(newRoom.rdvValueCents)) ? "" : parseInt(newRoom.rdvValueCents) / 100}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") {
                                                setNewRoom({ ...newRoom, rdvValueCents: "" });
                                            } else {
                                                setNewRoom({ ...newRoom, rdvValueCents: (Math.round(parseFloat(val) * 100)).toString() });
                                            }
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Objectif Signatures</label>
                                <input
                                    type="number"
                                    className="input-field font-bold"
                                    value={newRoom.signaturesGoal}
                                    onChange={(e) => setNewRoom({ ...newRoom, signaturesGoal: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Code de ralliement (Join Code)</label>
                                <input
                                    type="text"
                                    placeholder="ex: HOLI2026"
                                    className="input-field font-mono uppercase font-black tracking-widest text-center text-holi-orange"
                                    value={newRoom.joinCode}
                                    onChange={(e) => setNewRoom({ ...newRoom, joinCode: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <button disabled={loading} type="submit" className="btn-primary w-full mt-4 text-sm font-black uppercase tracking-wider">
                                Créer la Room
                            </button>
                        </form>
                    </div>
                </div>

                {/* Rooms List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-heading font-black flex items-center gap-2 text-holi-navy uppercase italic">
                            Rooms {showArchived ? "(Toutes)" : "Actives"}
                        </h2>
                        {archivedRooms.length > 0 && (
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="flex items-center gap-1.5 text-xs font-bold text-holi-grey hover:text-holi-orange transition-colors"
                            >
                                {showArchived ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showArchived ? "Masquer archivées" : `Voir archivées (${archivedRooms.length})`}
                            </button>
                        )}
                    </div>

                    {displayedRooms.length === 0 ? (
                        <div className="card text-center py-12 text-neutral-500">
                            Aucune room créée pour le moment.
                        </div>
                    ) : (
                        displayedRooms.map((room) => (
                            <div key={room.id} className={cn(
                                "card hover:border-white/20 transition-all",
                                room.status === "ARCHIVED" && "opacity-50"
                            )}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-holi-dark">{room.name}</h3>
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                room.status === "OPEN" ? "bg-holi-blue/10 text-holi-blue" :
                                                    room.status === "CLOSED" ? "bg-holi-dark/10 text-holi-grey" :
                                                        room.status === "ARCHIVED" ? "bg-neutral-200 text-neutral-400" :
                                                            "bg-holi-orange/10 text-holi-orange"
                                            )}>
                                                {room.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-holi-grey/80">
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-holi-navy/5 rounded text-holi-navy">
                                                <Lock className="w-3.5 h-3.5" /> {room.joinCode}
                                            </span>
                                            <span>Obj: <span className="text-holi-dark">{room.objectiveTotal}</span> RDVs</span>
                                            <span>Signatures: <span className="text-holi-dark">{room.signaturesGoal}</span></span>
                                            <span>Val: <span className="text-holi-dark">{formatCents(room.rdvValueCents)}</span></span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {room.status !== "ARCHIVED" && (
                                            <>
                                                {room.status === "DRAFT" || room.status === "CLOSED" ? (
                                                    <button
                                                        onClick={() => toggleRoom(room.id, 'open')}
                                                        className="btn-ghost text-xs py-2 px-4 text-holi-blue hover:bg-holi-blue/10 border-holi-blue/20 uppercase font-black"
                                                    >
                                                        <DoorOpen className="w-4 h-4" /> Ouvrir
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleRoom(room.id, 'close')}
                                                        className="btn-ghost text-xs py-2 px-4 text-holi-pink hover:bg-holi-pink/10 border-holi-pink/20 uppercase font-black"
                                                    >
                                                        <DoorClosed className="w-4 h-4" /> Fermer
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setEditingRoom({ ...room })}
                                                    className="btn-ghost text-xs py-2 px-4 text-holi-orange hover:bg-holi-orange/10 border-holi-orange/20 uppercase font-black"
                                                >
                                                    <Pencil className="w-4 h-4" /> Modifier
                                                </button>

                                                <button
                                                    onClick={() => requestArchive(room)}
                                                    className="btn-ghost text-xs py-2 px-4 text-neutral-400 hover:bg-neutral-100 border-neutral-200 uppercase font-black"
                                                >
                                                    <Archive className="w-4 h-4" /> Archiver
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => requestDelete(room)}
                                            className="btn-ghost text-xs py-2 px-4 text-red-400 hover:bg-red-50 border-red-200 uppercase font-black"
                                        >
                                            <Trash2 className="w-4 h-4" /> Supprimer
                                        </button>

                                        <Link
                                            href={`/admin/${room.id}/events`}
                                            className="btn-ghost text-xs py-2 px-4 uppercase font-black"
                                        >
                                            Events
                                        </Link>
                                    </div>
                                </div>

                                {room.status !== "DRAFT" && room.status !== "ARCHIVED" && (
                                    <div className="mt-6 pt-6 border-t border-black/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Link href={`/join/${room.id}`} target="_blank" className="flex items-center gap-2 text-xs font-bold text-holi-grey hover:text-holi-orange transition-colors">
                                            <LinkIcon className="w-3 h-3" /> Page Join <ExternalLink className="w-3 h-3" />
                                        </Link>
                                        <Link href={`/room/${room.id}`} target="_blank" className="flex items-center gap-2 text-xs font-bold text-holi-grey hover:text-holi-orange transition-colors">
                                            <LinkIcon className="w-3 h-3" /> Page Sales <ExternalLink className="w-3 h-3" />
                                        </Link>
                                        <Link href={`/screen/${room.id}`} target="_blank" className="flex items-center gap-2 text-xs font-bold text-holi-grey hover:text-holi-orange transition-colors">
                                            <LinkIcon className="w-3 h-3" /> Page TV <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingRoom && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingRoom(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-heading font-black text-holi-dark uppercase italic flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-holi-orange" /> Modifier la Room
                            </h2>
                            <button onClick={() => setEditingRoom(null)} className="p-1 hover:bg-neutral-100 rounded-full transition">
                                <X className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Nom</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={editingRoom.name}
                                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Objectif (RDV)</label>
                                    <input
                                        type="number"
                                        className="input-field font-bold"
                                        value={editingRoom.objectiveTotal}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, objectiveTotal: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Valeur RDV (€)</label>
                                    <input
                                        type="number"
                                        className="input-field font-bold"
                                        value={editingRoom.rdvValueCents / 100}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, rdvValueCents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Objectif Signatures</label>
                                    <input
                                        type="number"
                                        className="input-field font-bold"
                                        value={editingRoom.signaturesGoal}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, signaturesGoal: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-holi-grey mb-1 block">Join Code</label>
                                    <input
                                        type="text"
                                        className="input-field font-mono uppercase font-black tracking-widest text-center text-holi-orange"
                                        value={editingRoom.joinCode}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, joinCode: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={saveEdit}
                                disabled={loading}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm font-black uppercase"
                            >
                                <Check className="w-4 h-4" /> {loading ? "Sauvegarde..." : "Sauvegarder"}
                            </button>
                            <button
                                onClick={() => setEditingRoom(null)}
                                className="btn-ghost flex-1 text-sm font-black uppercase"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal (Archive / Delete) */}
            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                icon={confirmModal.icon}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
            />
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
