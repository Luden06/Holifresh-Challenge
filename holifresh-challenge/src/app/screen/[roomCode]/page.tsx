"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
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
    ];

    const maxValue = paliers[paliers.length - 1].value;
    const progressPercent = (currentScore / maxValue) * 100;

    return (
        <div className="min-h-screen w-full flex flex-col p-4 md:p-8 lg:p-12 overflow-hidden bg-[#fff7f1] text-[#272727] font-body relative select-none uppercase">
            {/* Ambient Lighting */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-[30%] bg-[#FF914D]/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-full h-[40%] bg-[#0079ed]/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="relative z-10 text-center mb-8 lg:mb-12">
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-heading font-black italic tracking-tighter text-[#0079ed] leading-none">
                    THERMOMÈTRE <span className="text-[#FF914D]">ÉQUIPE</span>
                </h1>
                <div className="flex items-center justify-center gap-4 mt-4 opacity-40">
                    <span className="text-[10px] lg:text-sm font-black tracking-[0.5em]">Holifresh • Challenge • 2026</span>
                </div>
            </header>

            <main className="flex-1 lg:grid lg:grid-cols-12 gap-0 relative z-10 items-stretch overflow-hidden">

                {/* Column 1: Paliers (Left) - Desktop ONLY */}
                <div className="hidden lg:flex lg:col-span-4 flex-col justify-start relative mt-8">
                    {paliers.map((p) => {
                        const pos = (p.value / maxValue) * 100;
                        const isReached = currentScore >= p.value;
                        return (
                            <div
                                key={p.value}
                                className="absolute right-8 flex items-center justify-end"
                                style={{ bottom: `${pos}%`, transform: 'translateY(50%)' }}
                            >
                                <div className={cn(
                                    "flex items-center gap-4 transition-all duration-700 text-right mr-6",
                                    isReached ? "opacity-100 scale-110" : "opacity-15"
                                )}>
                                    <span className="text-xl lg:text-2xl font-heading font-black italic tracking-tighter leading-none" style={{ color: isReached ? p.color : '#737373' }}>
                                        {p.label}
                                    </span>
                                    <span className="text-4xl lg:text-6xl font-heading font-black tabular-nums tracking-tighter" style={{ color: isReached ? p.color : '#737373' }}>
                                        {p.value}
                                    </span>
                                </div>
                                <div className={cn(
                                    "h-1 w-8 transition-all duration-1000",
                                    isReached ? "bg-[#272727]/10" : "bg-[#272727]/5"
                                )} />
                            </div>
                        );
                    })}
                </div>

                {/* Column 2: Centered Thermometer */}
                <div className="flex-none lg:col-span-1 flex flex-col items-center justify-center lg:justify-start lg:pt-8 relative">
                    <div className="relative w-14 lg:w-24 h-[45vh] md:h-[55vh] lg:h-[62vh] bg-white/40 backdrop-blur-3xl border-[6px] border-white rounded-full p-2 shadow-xl overflow-visible">
                        {/* Improved Liquid Column - No aggressive shadow clash */}
                        <div className="absolute bottom-2 left-2 right-2 rounded-full bg-gradient-to-t from-[#FF914D] via-[#DA3B17] to-[#0079ed] transition-all duration-1500 ease-out"
                            style={{
                                height: `${Math.max(4, Math.min(progressPercent, 100))}%`,
                                minHeight: '30px'
                            }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-8 -mt-4 bg-white/30 blur-md rounded-full animate-pulse" />
                        </div>

                        {/* Mobile Indicators */}
                        <div className="lg:hidden absolute inset-0 pointer-events-none">
                            {paliers.map((p) => {
                                const pos = (p.value / maxValue) * 100;
                                const isReached = currentScore >= p.value;
                                return (
                                    <div
                                        key={p.value}
                                        className="absolute left-full ml-4 flex items-center"
                                        style={{ bottom: `${pos}%`, transform: 'translateY(50%)' }}
                                    >
                                        <div className="w-4 h-0.5 bg-[#272727]/10" />
                                        <span className={cn(
                                            "text-3xl font-heading font-black ml-2",
                                            isReached ? "opacity-100 scale-110" : "opacity-20"
                                        )} style={{ color: isReached ? p.color : '#272727' }}>
                                            {p.value}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Column 3: Vertical Stats Card (Desktop Right) */}
                <div className="flex-1 lg:col-span-7 flex flex-col justify-center lg:pl-24 lg:pb-12">
                    <div className="bg-white/70 backdrop-blur-3xl p-6 lg:p-12 rounded-[3.5rem] border-2 border-white shadow-xl flex flex-col gap-10 lg:gap-14 max-w-[500px] lg:max-w-none">

                        {/* Score Block */}
                        <div className="space-y-2 lg:space-y-4">
                            <p className="text-xs lg:text-sm font-black text-[#737373]/60 tracking-[0.5em]">SCORE ÉQUIPE</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-[7rem] lg:text-[11rem] font-heading font-black text-[#272727] tracking-tighter leading-[0.8]">{currentScore}</span>
                                <span className="text-3xl lg:text-5xl font-heading font-black text-[#737373]/30 italic tracking-tighter">/ {objective}</span>
                            </div>
                        </div>

                        <div className="h-px w-full bg-[#272727]/5" />

                        {/* Business Block */}
                        <div className="space-y-3 lg:space-y-4">
                            <p className="text-xs lg:text-sm font-black text-[#737373]/60 tracking-[0.5em]">BUSINESS POTENTIEL</p>
                            <p className="text-5xl lg:text-[5.5rem] font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF914D] to-[#0079ed] italic tracking-tighter leading-none">
                                {formatCents(summary?.businessTotalCents || 0)}
                            </p>
                        </div>

                        {/* Meta Info Block - Better Alignment */}
                        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 justify-between items-start xl:items-center">
                            <div className="flex items-center gap-4 bg-[#007f47]/5 border border-[#007f47]/10 px-6 py-4 rounded-3xl">
                                <Award className="w-10 h-10 text-[#007f47]" />
                                <div>
                                    <p className="text-xl lg:text-2xl font-heading font-black text-[#007f47] leading-none">SIGNATURES : 15</p>
                                    <p className="text-[10px] font-bold italic opacity-50 text-[#737373] mt-1 tracking-tight">Rappel : la finalité reste le contrat.</p>
                                </div>
                            </div>

                            {summary?.leaderboard?.length > 0 && (
                                <div className="flex items-center gap-4 bg-[#FFBC4D]/10 border border-[#FFBC4D]/20 px-6 py-4 rounded-3xl">
                                    <Crown className="w-8 h-8 text-[#FFBC4D]" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-[#FFBC4D] tracking-widest leading-none mb-1">MVP</span>
                                        <span className="text-xl lg:text-2xl font-heading font-black text-[#272727] italic truncate max-w-[150px]">{summary.leaderboard[0].displayName}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer - Pushed down for breathing room */}
            <footer className="relative z-10 h-14 flex items-center justify-between border-t border-[#272727]/5 text-[10px] lg:text-xs text-[#737373]/40 font-black tracking-[0.4em] mt-8">
                <div className="flex items-center gap-6">
                    <TrendingUp className="w-4 h-4 text-[#FF914D]" />
                    <span>HOLIFRESH • CHALLENGE • ENGINE V2.2 PREMIUM POLISH</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#007f47] animate-pulse" />
                    <span>LIVE SYNC READY</span>
                </div>
            </footer>
        </div>
    );
}
