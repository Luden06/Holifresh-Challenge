"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to admin for now, or we could have a branded splash screen
    const timer = setTimeout(() => {
      router.push("/admin");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="animate-float flex flex-col items-center gap-8">
        <div className="relative w-48 h-48 bg-gradient-to-br from-holi-orange to-holi-red rounded-full flex items-center justify-center shadow-2xl shadow-holi-orange/40">
          <span className="text-white font-logo font-black text-4xl italic tracking-tighter">HOLI</span>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-heading font-black text-holi-dark uppercase italic tracking-tighter">Sales Challenge</h1>
          <p className="text-holi-grey font-bold animate-pulse-soft">Initialisation de l'expérience...</p>
        </div>
      </div>
    </div>
  );
}
