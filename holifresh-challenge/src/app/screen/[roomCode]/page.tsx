"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

// High-impact particle for the TV Screen
class TVParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    shape: 'circle' | 'rect';

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 6;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 12 + 4;
        this.color = color;
        this.life = 0;
        this.maxLife = Math.random() * 60 + 60;
        this.shape = Math.random() > 0.5 ? 'circle' : 'rect';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // light gravity
        this.vx *= 0.99;
        this.life++;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const opacity = 1 - (this.life / this.maxLife);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.life * 0.1);
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }
}

export default function TVScreenPage() {
    const { roomCode } = useParams();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Animation States
    const [showFlash, setShowFlash] = useState(false);
    const [reachedPalierText, setReachedPalierText] = useState<string | null>(null);

    // Refs for tracking and drawing
    const prevScoreRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<TVParticle[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    const triggerPalierCelebration = (palier: any) => {
        // 1. Particle explosion
        const canvas = canvasRef.current;
        if (canvas) {
            const colors = [palier.color, '#ffffff', '#FFD700', '#0079ed'];
            for (let i = 0; i < 150; i++) {
                particlesRef.current.push(new TVParticle(canvas.width / 2, canvas.height / 2, colors[Math.floor(Math.random() * colors.length)]));
            }
        }

        // 2. Screen Flash
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 800);

        // 3. Floating Text
        setReachedPalierText(palier.label);
        setTimeout(() => setReachedPalierText(null), 4000);
    };

    const fetchSummary = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${roomCode}/summary`);
            if (res.ok) {
                const data = await res.json();
                const newScore = data.totals || 0;

                // Check for palier crossing
                if (summary) {
                    const objective = data.objectiveTotal || 50;
                    const stretchGoal = Math.round(objective * 1.1);
                    const currentPaliers = [
                        { value: 5, label: "MISE EN RYTHME !" },
                        { value: 10, label: "MOMENTUM REACHED !" },
                        { value: 20, label: "ACCÉLÉRATION !" },
                        { value: 30, label: "EN FEU 🔥" },
                        { value: 40, label: "DERNIÈRE LIGNE DROITE !" },
                        { value: objective, label: "OBJECTIF ATTEINT ! 🎯", color: "#ce2258" },
                        { value: stretchGoal, label: "STRETCH GOAL EXPLOSÉ ! 🔥", color: "#826094" },
                    ];

                    for (const p of currentPaliers) {
                        if (prevScoreRef.current < p.value && newScore >= p.value) {
                            triggerPalierCelebration({ ...p, color: p.color || '#FF914D' });
                            break; // Show one celebration at a time
                        }
                    }
                }

                prevScoreRef.current = newScore;
                setSummary(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [roomCode, summary]);

    useEffect(() => {
        fetchSummary();
        const interval = setInterval(fetchSummary, 3000);

        // Animation Loop
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

    const reachedPaliers = paliers.filter(p => currentScore >= p.value);
    const lastReachedPalierValue = reachedPaliers.length > 0 ? reachedPaliers[0].value : null;

    return (
        <div className="min-h-screen w-full flex flex-col p-4 md:p-8 lg:p-10 overflow-hidden bg-[#fffcf9] text-[#272727] font-body relative select-none uppercase">

            {/* Animation Layers */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-[100]"
                width={typeof window !== 'undefined' ? window.innerWidth : 1920}
                height={typeof window !== 'undefined' ? window.innerHeight : 1080}
            />

            {showFlash && (
                <div className="fixed inset-0 bg-white z-[110] animate-flash-out pointer-events-none" />
            )}

            {reachedPalierText && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
                    <div className="animate-float-center text-center">
                        <h2 className="text-5xl md:text-8xl lg:text-[12rem] font-heading font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#FF914D] to-[#DA3B17] drop-shadow-[0_10px_30px_rgba(218,59,23,0.3)]">
                            {reachedPalierText}
                        </h2>
                    </div>
                </div>
            )}

            {/* Premium Ambient Lighting */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden text-center">
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-[#FF914D]/10 blur-[150px] rounded-full animate-pulse-soft" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-[#0079ed]/10 blur-[150px] rounded-full animate-pulse-soft" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
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
                <div className="hidden lg:flex lg:col-span-4 pointer-events-none" />

                <div className="lg:col-span-4 flex items-center justify-center relative mb-12 lg:mb-0">
                    <div className="relative h-[45vh] lg:h-[75vh] w-14 lg:w-28 flex justify-center translate-x-12 lg:translate-x-0">
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

                        <div className="relative w-full h-full bg-white/60 backdrop-blur-3xl border-[4px] lg:border-[8px] border-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-1 lg:p-2">
                            <div className="absolute top-[5%] left-[15%] w-[10%] h-[40%] bg-white/40 blur-[2px] rounded-full z-30 pointer-events-none" />
                            <div className="absolute inset-1 lg:inset-2 overflow-hidden rounded-full bg-[#f8f0ea] shadow-inner">
                                <div className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[#FF914D] via-[#DA3B17] to-[#0079ed] transition-all duration-1500 ease-out"
                                    style={{ height: `${Math.max(4, Math.min(progressPercent, 100))}%` }}
                                >
                                    <div className="absolute top-0 left-0 right-0 h-10 -mt-5 bg-white/40 blur-md rounded-full animate-pulse" />
                                </div>
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

                <div className="lg:col-span-4 flex flex-col justify-center lg:pl-10 lg:pr-6 mt-8 lg:mt-0">
                    <div className="bg-white/40 backdrop-blur-3xl p-6 lg:p-8 rounded-[2.5rem] border border-white shadow-[0_30px_60px_rgba(0,0,0,0.04)] flex flex-col gap-6 lg:gap-8 relative overflow-hidden mx-auto w-full max-w-[400px] lg:max-w-none">
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

                        <div className="relative w-full">
                            <div className="h-px w-full bg-black/5 mb-6" />
                            <span className="flex items-center gap-2 text-[9px] lg:text-[10px] font-black text-black/30 tracking-[0.4em] mb-1">
                                <TrendingUp className="w-3 h-3" /> BUSINESS POTENTIEL
                            </span>
                            <p className="text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[6rem] font-logo font-black text-[#FF914D] italic tracking-tighter leading-none truncate max-w-full">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round((summary?.businessTotalCents || 0) / 100))}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 mt-2">
                            <div className="flex items-center gap-3 bg-white/70 border border-black/5 p-3 rounded-2xl shadow-sm">
                                <Award className="w-7 h-7 text-[#007f47] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-lg lg:text-xl font-heading font-black text-[#007f47] italic tracking-tighter leading-none">SIGNATURES : {summary?.signaturesGoal || 0}</p>
                                    <p className="text-[7px] font-black opacity-30 mt-0.5">CONTRATS ACTIFS</p>
                                </div>
                            </div>

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

            <footer className="relative z-10 h-12 flex items-center justify-between border-t border-black/5 text-[7px] lg:text-[8px] text-black/20 font-black tracking-[0.4em] mt-8 px-2">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2 invisible lg:visible">
                        <TrendingUp className="w-2.5 h-2.5 text-[#FF914D]" />
                        ENGINE V2.5.0
                    </span>
                    <span>HOLIFRESH • 2026</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#007f47]/40" />
                    <span>SYSTEM READY</span>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes flash-out {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-flash-out {
                    animation: flash-out 0.8s ease-out forwards;
                }
                @keyframes float-center {
                    0% { transform: scale(0.5); opacity: 0; filter: blur(20px); }
                    10% { transform: scale(1.1); opacity: 1; filter: blur(0); }
                    15% { transform: scale(1); }
                    85% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; filter: blur(50px); }
                }
                .animate-float-center {
                    animation: float-center 4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
            `}</style>
        </div>
    );
}
