import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper: determine if a boost is currently effectively active
function isBoostEffectivelyActive(boost: {
    isActive: boolean;
    activatedAt: Date | null;
    durationMin: number | null;
    startAt: Date | null;
    endAt: Date | null;
}) {
    if (!boost.isActive) return false;
    const now = new Date();
    if (boost.startAt && now < boost.startAt) return false;

    // Check endAt (fixed date) first
    if (boost.endAt && now > boost.endAt) return false;

    // Check duration-based expiration
    if (boost.durationMin && boost.activatedAt) {
        const expiresAt = new Date(boost.activatedAt.getTime() + boost.durationMin * 60 * 1000);
        if (now > expiresAt) return false;
    }

    return true;
}

// Helper: compute expiration time for display
function getExpiresAt(boost: { activatedAt: Date | null; durationMin: number | null; endAt: Date | null }) {
    if (boost.endAt) return boost.endAt;
    if (boost.durationMin && boost.activatedAt) {
        return new Date(boost.activatedAt.getTime() + boost.durationMin * 60 * 1000);
    }
    return null;
}

// GET /api/rooms/[roomId]/boosts — list all boosts for the room
export async function GET(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;

    try {
        const boosts = await prisma.boost.findMany({
            where: { roomId },
            orderBy: { createdAt: "desc" },
        });

        const enriched = boosts.map((b) => ({
            ...b,
            effectivelyActive: isBoostEffectivelyActive(b),
            expiresAt: getExpiresAt(b),
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("List boosts error:", error);
        return NextResponse.json({ error: "Failed to list boosts" }, { status: 500 });
    }
}

// POST /api/rooms/[roomId]/boosts — create a new boost
export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { label, type, multiplier, bonusCents, palierScope, palierTarget, isActive, startAt, endAt, description, trigger, durationMin } = body;

        if (!label || !type) {
            return NextResponse.json({ error: "label and type are required" }, { status: 400 });
        }

        if (type !== "MULTIPLIER" && type !== "FLAT_BONUS" && type !== "PALIER") {
            return NextResponse.json({ error: "type must be MULTIPLIER, FLAT_BONUS or PALIER" }, { status: 400 });
        }

        if (type === "MULTIPLIER" && (!multiplier || multiplier <= 0)) {
            return NextResponse.json({ error: "multiplier must be > 0 for MULTIPLIER type" }, { status: 400 });
        }

        if (type === "FLAT_BONUS" && (!bonusCents || bonusCents <= 0)) {
            return NextResponse.json({ error: "bonusCents must be > 0 for FLAT_BONUS type" }, { status: 400 });
        }

        if (type === "PALIER") {
            if (!bonusCents || bonusCents <= 0) {
                return NextResponse.json({ error: "bonusCents must be > 0 for PALIER type" }, { status: 400 });
            }
            if (!palierScope || (palierScope !== "INDIVIDUAL" && palierScope !== "TEAM")) {
                return NextResponse.json({ error: "palierScope must be INDIVIDUAL or TEAM for PALIER type" }, { status: 400 });
            }
            if (!palierTarget || palierTarget <= 0) {
                return NextResponse.json({ error: "palierTarget must be > 0 for PALIER type" }, { status: 400 });
            }
        }

        const boost = await prisma.boost.create({
            data: {
                roomId,
                label,
                description: description || null,
                type,
                multiplier: type === "MULTIPLIER" ? parseFloat(multiplier) : null,
                bonusCents: (type === "FLAT_BONUS" || type === "PALIER") ? parseInt(bonusCents) : null,
                palierScope: type === "PALIER" ? palierScope : null,
                palierTarget: type === "PALIER" ? parseInt(palierTarget) : null,
                trigger: trigger || null,
                durationMin: durationMin ? parseInt(durationMin) : null,
                isActive: isActive || false,
                startAt: startAt ? new Date(startAt) : null,
                endAt: endAt ? new Date(endAt) : null,
            },
        });

        return NextResponse.json({
            ...boost,
            effectivelyActive: isBoostEffectivelyActive(boost),
            expiresAt: getExpiresAt(boost),
        });
    } catch (error) {
        console.error("Create boost error:", error);
        return NextResponse.json({ error: "Failed to create boost" }, { status: 500 });
    }
}
