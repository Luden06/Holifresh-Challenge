"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    Target,
    Award,
    Crown,
    TrendingUp
} from "lucide-react";
import { formatCents, cn } from "@/lib/utils";

export default function TVScreenPage() {
    const { roomCode } = useParams();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        fetchSummary();
        const interval = setInterval(fetchSummary, 3000);
        return () => clearInterval(interval);
    }, [roomCode, fetchSummary]);

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#fff7f1]">
                <div className="w-12 h-12 border-4 border-[#FF914D] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentScore = summary?.totals || 0;
    const objective = summary?.objectiveTotal || 44;

    // Structured paliers 
    const paliers = [
        { value: 5, label: "Mise en rythme", color: "#737373" },
        { value: 10, label: "Momentum", color: "#0079ed" },
        { value: 20, label: "Première bascule", color: "#4DADDF" },
        { value: 30, label: "Accélération", color: "#FF914D" },
        { value: 40, label: "Presque là", color: "#DA3B17" },
        { value: objective, label: "Objectif atteint 🎯", color: "#ce2258", isTarget: true },
        { value: 50, label: "Stretch goal 🔥", color: "#826094" },
    ];

    const maxValue = paliers[paliers.length - 1].value;
    const progressPercent = (currentScore / maxValue) * 100;

    return (
        <div className="h-screen w-full flex flex-col p-12 overflow-hidden bg-[#fff7f1] text-[#272727] font-body relative select-none">
            {/* Ambient Lighting */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[60%] h-[50%] bg-[#FF914D]/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[#0079ed]/5 blur-[120px] rounded-full" />
            </div>

            {/* Premium Header */}
            <header className="relative z-10 text-center mb-12">
                <div className="inline-flex items-center gap-3 px-5 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white shadow-sm mb-6">
                    <span className="w-2 h-2 rounded-full bg-[#FF914D] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0079ed]/70">Live Challenge Dashboard</span>
                </div>
                <h1 className="text-9xl font-heading font-black italic tracking-tighter uppercase text-[#0079ed] leading-none drop-shadow-sm">
                    THERMOMÈTRE <span className="text-[#FF914D]">ÉQUIPE</span>
                </h1>
                <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="h-px w-20 bg-[#0079ed]/10" />
                    <p className="text-[#737373]/60 font-black uppercase tracking-[0.2em] text-xs font-heading italic">Vision Holifresh • 2026</p>
                    <div className="h-px w-20 bg-[#0079ed]/10" />
                </div>
            </header>

            <main className="flex-1 flex gap-24 relative z-10 px-12">
                {/* Column 1: The Glass Thermometer (Left) */}
                <div className="w-1/5 flex flex-col items-center justify-center h-full relative group">
                    {/* The Tube */}
                    <div className="relative w-24 h-[65vh] bg-white/50 backdrop-blur-xl border-4 border-white rounded-full p-2.5 shadow-[0_30px_60px_rgba(0,0,0,0.05)] overflow-visible">
                        {/* Reflections/Speculars */}
                        <div className="absolute top-12 left-6 w-3 h-40 bg-white/40 blur-md rounded-full z-30" />

                        {/* The Fluid Column */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 rounded-full bg-gradient-to-t from-[#FF914D] via-[#DA3B17] to-[#0079ed] transition-all duration-1500 ease-out shadow-[0_0_20px_rgba(255,145,77,0.4)]"
                            style={{ height: `calc(${Math.min(progressPercent, 100)}% - 5px)` }}
                        >
                            {/* Fluid Movement Effect */}
                            <div className="absolute top-0 left-0 right-0 h-4 -mt-2 bg-white/30 blur-sm rounded-full animate-pulse" />
                            <div className="absolute inset-0 overflow-hidden rounded-full">
                                <div className="absolute w-4 h-4 bg-white/20 rounded-full blur-sm top-1/4 left-1/4 animate-bounce" />
                            </div>
                        </div>

                        {/* Visual Marker for Objective (44) */}
                        <div
                            className="absolute left-[-2.5rem] right-[-2.5rem] h-1.5 bg-[#ce2258] z-40 flex items-center shadow-[0_0_15px_rgba(206,34,88,0.4)]"
                            style={{ bottom: `calc(${(objective / maxValue) * 100}% + 10px)` }}
                        >
                            <div className="absolute right-full mr-4 bg-[#ce2258] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase italic tracking-tighter shadow-xl transform rotate-[-3deg]">OBJECTIF</div>
                            <div className="absolute left-full ml-4 w-64 h-px bg-gradient-to-r from-[#ce2258] to-transparent" />
                        </div>
                    </div>
                    {/* The Bulb (Base) */}
                    <div className="w-32 h-32 bg-white border-4 border-white rounded-full -mt-12 z-20 shadow-2xl flex items-center justify-center relative overflow-hidden ring-4 ring-[#fff7f1]">
                        <div className="absolute inset-0 bg-[#FF914D]" />
                        <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent rounded-full" />
                        <span className="relative z-10 text-white font-heading font-black text-4xl italic tracking-tighter">RDV</span>
                    </div>
                </div>

                {/* Column 2: Paliers & Main Stats (Right) */}
                <div className="flex-1 flex flex-col justify-between py-2">
                    {/* Paliers Row List */}
                    <div className="flex-1 flex flex-col justify-around py-4">
                        {paliers.map((p, idx) => {
                            const isReached = currentScore >= p.value;
                            return (
                                <div key={p.value} className={cn(
                                    "grid grid-cols-[140px_1fr] gap-12 items-center transition-all duration-1000",
                                    isReached ? "opacity-100 translate-x-12 scale-110" : "opacity-15"
                                )}>
                                    <div className="text-right">
                                        <span className="text-7xl font-heading font-black tabular-nums tracking-tighter" style={{ color: isReached ? p.color : '#737373' }}>
                                            {p.value}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <span className="text-6xl font-heading font-black uppercase italic tracking-tighter leading-none block whitespace-nowrap" style={{ color: isReached ? p.color : '#737373' }}>
                                            {p.label}
                                        </span>
                                        {p.isTarget && isReached && (
                                            <div className="absolute -inset-4 bg-[#ce2258]/10 blur-2xl -z-10 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Data Panel (Aerospace Design) */}
                    <div className="mt-12 bg-white/70 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white shadow-[0_30px_80px_rgba(0,0,0,0.06)] grid grid-cols-[1fr_2px_1.5fr] gap-12 items-center">
                        <div className="space-y-4">
                            <p className="text-[11px] font-black text-[#737373]/60 uppercase tracking-[0.4em]">SCORE CUMULÉ ÉQUIPE</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-[10rem] font-heading font-black text-[#272727] leading-none tracking-tighter">{currentScore}</span>
                                <span className="text-4xl font-heading font-black text-[#737373]/30 italic">/ {objective}</span>
                            </div>
                        </div>

                        <div className="h-40 bg-[#272727]/5" />

                        <div className="space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-[#737373]/60 uppercase tracking-[0.4em]">Business Potentiel Estimé</p>
                                    <p className="text-7xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF914D] to-[#0079ed] italic leading-none tracking-tighter">
                                        {formatCents(summary?.businessTotalCents || 0)}
                                    </p>
                                </div>
                                {summary?.leaderboard?.length > 0 && (
                                    <div className="flex flex-col items-center gap-1 bg-[#FFBC4D]/10 border border-[#FFBC4D]/20 px-8 py-5 rounded-[2.5rem] shadow-sm transform rotate-[2deg]">
                                        <Crown className="w-10 h-10 text-[#FFBC4D] drop-shadow-[0_0_10px_rgba(255,188,77,0.5)]" />
                                        <span className="text-[9px] font-black uppercase text-[#FFBC4D] tracking-widest text-center mt-1">MVP DU JOUR</span>
                                        <span className="text-2xl font-heading font-black text-[#272727] italic uppercase block max-w-[180px] truncate">{summary.leaderboard[0].displayName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-5 p-5 bg-[#007f47]/5 border border-[#007f47]/10 rounded-3xl">
                                <Award className="w-8 h-8 text-[#007f47]" />
                                <div>
                                    <p className="text-xl font-heading font-black text-[#007f47] uppercase tracking-tighter">Objectif signatures : 15</p>
                                    <p className="text-[11px] text-[#737373] font-bold italic opacity-80">Les paliers franchis sont des étapes vers la réussite finale.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Visual Footer */}
            <footer className="relative z-10 px-8 h-10 flex items-center justify-between border-t border-[#272727]/5 text-[10px] text-[#737373]/40 font-bold uppercase tracking-[0.5em] mt-8">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-[#FF914D]" />
                        <span>HOLIFRESH SALES CHALLENGE 2026</span>
                    </div>
                    <span className="opacity-30">|</span>
                    <span>ENGINE STATUS: V1.5 PREMIUM UNLOCKED</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#007f47] animate-pulse" />
                    <span className="opacity-60 text-[9px]">CONNECTION ACTIVE • INTERVAL 3S</span>
                </div>
            </footer>
        </div>
    );
}
