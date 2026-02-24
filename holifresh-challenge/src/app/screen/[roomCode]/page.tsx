"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    Award,
    Crown,
    TrendingUp,
    Target,
    Zap,
    CalendarCheck
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
            <div className="flex items-center justify-center min-h-screen bg-[#fffcf9]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#FF914D]/20 rounded-full" />
                    <div className="absolute top-0 w-16 h-16 border-4 border-[#FF914D] border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const currentScore = summary?.totals || 0;
    const objective = summary?.objectiveTotal || 50;
    const stretchGoal = Math.round(objective * 1.1);

    // Precise Paliers
    const paliers = [
        { value: 5, label: "Mise en rythme", color: "#737373" },
        { value: 10, label: "Momentum", color: "#0079ed" },
        { value: 20, label: "Première bascule", color: "#4DADDF" },
        { value: 30, label: "Accélération", color: "#FF914D" },
        { value: 40, label: "Presque là", color: "#DA3B17" },
        { value: objective, label: "Objectif atteint 🎯", color: "#ce2258", isTarget: true },
        { value: stretchGoal, label: "Stretch goal 🔥", color: "#826094" },
    ].sort((a, b) => b.value - a.value);

    const maxValue = Math.max(stretchGoal, currentScore, objective) * 1.05;
    const progressPercent = (currentScore / maxValue) * 100;

    // Find the closest reached palier to highlight it
    const reachedPaliers = paliers.filter(p => currentScore >= p.value);
    const lastReachedPalierValue = reachedPaliers.length > 0 ? reachedPaliers[0].value : null;

    return (
        <div className="min-h-screen w-full flex flex-col p-4 md:p-8 lg:p-10 overflow-hidden bg-[#fffcf9] text-[#272727] font-body relative select-none uppercase">
            {/* Premium Ambient Lighting */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden text-center">
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-[#FF914D]/10 blur-[150px] rounded-full animate-pulse-soft" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-[#0079ed]/10 blur-[150px] rounded-full animate-pulse-soft" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header - More Compact */}
            <header className="relative z-10 text-center mb-6 lg:mb-10">
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-heading font-black italic tracking-tighter leading-none">
                    <span className="text-[#0079ed]">THERMOMÈTRE</span> <span className="text-[#FF914D]">ÉQUIPE</span>
                </h1>
                <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="h-px w-8 bg-black/10" />
                    <span className="text-[8px] lg:text-[10px] font-logo font-black tracking-[0.6em] text-black/40 italic">Holifresh • Challenge • 2026</span>
                    <div className="h-px w-8 bg-black/10" />
                </div>
            </header>

            <main className="flex-1 lg:grid lg:grid-cols-12 gap-0 relative z-10 items-stretch">

                {/* Column 1: Left Spacer */}
                <div className="hidden lg:flex lg:col-span-4 pointer-events-none" />

                {/* Column 2: Centered Thermometer (70% size on mobile) */}
                <div className="lg:col-span-4 flex items-center justify-center relative mb-12 lg:mb-0">
                    <div className="relative h-[45vh] lg:h-[75vh] w-14 lg:w-28 flex justify-center translate-x-12 lg:translate-x-0">

                        {/* Paliers Labels (Compressed on mobile) */}
                        <div className="absolute right-full mr-2 lg:mr-6 inset-y-0 w-[400px] pointer-events-none">
                            {paliers.map((p) => {
                                const pos = (p.value / maxValue) * 100;
                                const isReached = currentScore >= p.value;
                                const isCurrentActive = p.value === lastReachedPalierValue;
                                return (
                                    <div
                                        key={p.value}
                                        className="absolute right-0 flex items-center transition-all duration-700"
                                        style={{ bottom: `${pos}%`, transform: 'translateY(50%)' }}
                                    >
                                        <div className={cn(
                                            "flex items-center gap-2 lg:gap-3 text-right mr-2 lg:mr-3 transform transition-all duration-700",
                                            isCurrentActive ? "opacity-100 scale-100" : (isReached ? "opacity-35 scale-90" : "opacity-15 scale-75")
                                        )}>
                                            <span className={cn(
                                                "font-heading font-black italic tracking-tighter leading-none transition-all duration-500",
                                                isCurrentActive ? "text-sm lg:text-xl" : "text-[8px] lg:text-[10px]"
                                            )} style={{ color: isReached ? p.color : '#737373' }}>
                                                {p.label}
                                            </span>
                                            <span className={cn(
                                                "font-logo font-black italic tabular-nums tracking-tighter transition-all duration-500",
                                                isCurrentActive ? "text-2xl lg:text-6xl" : "text-lg lg:text-2xl"
                                            )} style={{ color: isReached ? p.color : '#737373' }}>
                                                {p.value}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "h-[1px] w-4 lg:w-16 bg-gradient-to-r transition-all duration-1000",
                                            isReached ? "from-transparent to-black/20" : "from-transparent to-black/5"
                                        )} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* THE TUBE */}
                        <div className="relative w-full h-full bg-white/60 backdrop-blur-3xl border-[4px] lg:border-[8px] border-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-1 lg:p-2">
                            <div className="absolute top-[5%] left-[15%] w-[10%] h-[40%] bg-white/40 blur-[2px] rounded-full z-30 pointer-events-none" />

                            <div className="absolute inset-1 lg:inset-2 overflow-hidden rounded-full bg-[#f8f0ea] shadow-inner">
                                <div className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[#FF914D] via-[#DA3B17] to-[#0079ed] transition-all duration-1500 ease-out"
                                    style={{ height: `${Math.max(4, Math.min(progressPercent, 100))}%` }}
                                >
                                    <div className="absolute top-0 left-0 right-0 h-10 -mt-5 bg-white/40 blur-md rounded-full animate-pulse" />
                                </div>

                                {/* Precise Target Line Alignment */}
                                <div
                                    className="absolute left-0 right-0 border-t-[2px] lg:border-t-[4px] border-white z-40 transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                                    style={{
                                        bottom: `${(objective / maxValue) * 100}%`,
                                        transform: 'translateY(1.5px)'
                                    }}
                                >
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-1.5 py-0.5 rounded-[3px] lg:rounded-[4px] text-[6px] lg:text-[9px] font-black uppercase tracking-tighter text-[#DA3B17] shadow-xl border border-black/5 whitespace-nowrap">
                                        OBJECTIF
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Stats (1/3 Width on Desktop, Lower on Mobile) */}
                <div className="lg:col-span-4 flex flex-col justify-center lg:pl-10 lg:pr-6 mt-8 lg:mt-0">
                    <div className="bg-white/40 backdrop-blur-3xl p-6 lg:p-8 rounded-[2.5rem] border border-white shadow-[0_30px_60px_rgba(0,0,0,0.04)] flex flex-col gap-6 lg:gap-8 relative overflow-hidden mx-auto w-full max-w-[400px] lg:max-w-none">

                        {/* RDV Score */}
                        <div className="relative">
                            <span className="flex items-center gap-2 text-[9px] lg:text-[10px] font-black text-black/30 tracking-[0.4em] mb-1">
                                <CalendarCheck className="w-3 h-3" /> RDV PRIS
                            </span>
                            <div className="flex items-end gap-3">
                                <span className="text-7xl lg:text-[10rem] font-logo font-black italic text-[#272727] tracking-tighter leading-[0.75]">
                                    {currentScore}
                                </span>
                                <div className="mb-2 flex flex-col">
                                    <span className="text-2xl lg:text-4xl font-logo font-black text-black/10 italic tracking-tighter">/ {objective}</span>
                                </div>
                            </div>
                        </div>

                        {/* Business Impact */}
                        <div className="relative">
                            <div className="h-px w-full bg-black/5 mb-6" />
                            <span className="flex items-center gap-2 text-[9px] lg:text-[10px] font-black text-black/30 tracking-[0.4em] mb-1">
                                <TrendingUp className="w-3 h-3" /> BUSINESS POTENTIEL
                            </span>
                            <p className="text-4xl lg:text-[6rem] font-logo font-black text-[#FF914D] italic tracking-tighter leading-none">
                                {formatCents(summary?.businessTotalCents || 0)}
                            </p>
                        </div>

                        {/* Action Badges */}
                        <div className="flex flex-col gap-3 mt-2">
                            {/* Signatures */}
                            <div className="flex items-center gap-3 bg-white/70 border border-black/5 p-3 rounded-2xl shadow-sm">
                                <Award className="w-7 h-7 text-[#007f47] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-lg lg:text-xl font-heading font-black text-[#007f47] italic tracking-tighter leading-none">SIGNATURES : {summary?.signaturesGoal || 0}</p>
                                    <p className="text-[7px] font-black opacity-30 mt-0.5">CONTRATS ACTIFS</p>
                                </div>
                            </div>

                            {/* MVP */}
                            {summary?.leaderboard?.length > 0 && (
                                <div className="flex items-center gap-3 bg-gradient-to-br from-[#FFBC4D]/10 to-[#FFBC4D]/20 border border-[#FFBC4D]/15 p-3 rounded-2xl shadow-sm">
                                    <Crown className="w-7 h-7 text-[#FFBC4D] shrink-0" />
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[7px] font-black text-[#FFBC4D] tracking-widest mb-0.5">MVP</span>
                                        <span className={cn(
                                            "font-heading font-black text-[#272727] italic tracking-tighter truncate leading-none",
                                            summary.leaderboard[0].displayName.length > 15 ? "text-xs lg:text-base" : "text-base lg:text-lg"
                                        )}>
                                            {summary.leaderboard[0].displayName}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer - Subtle */}
            <footer className="relative z-10 h-12 flex items-center justify-between border-t border-black/5 text-[7px] lg:text-[8px] text-black/20 font-black tracking-[0.4em] mt-8 px-2">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 invisible lg:visible">
                        <TrendingUp className="w-2.5 h-2.5 text-[#FF914D]" />
                        ENGINE V2.4.3
                    </span>
                    <span>HOLIFRESH • 2026</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#007f47]/40" />
                    <span>SYSTEM READY</span>
                </div>
            </footer>
        </div>
    );
}
