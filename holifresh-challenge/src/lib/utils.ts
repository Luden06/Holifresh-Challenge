import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCents(cents: number) {
    return (cents / 100).toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
    });
}

export function generateJoinCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toLowerCase();
}

export function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}
