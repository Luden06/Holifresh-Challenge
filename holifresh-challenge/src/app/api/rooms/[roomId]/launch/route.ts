import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/rooms/[roomId]/launch — Launch the event (OPEN → LIVE)
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
        // Only allow launching from OPEN status
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }
        if (room.status !== "OPEN") {
            return NextResponse.json({ error: `Cannot launch from status '${room.status}'. Room must be OPEN.` }, { status: 400 });
        }

        const now = new Date();

        // 1. Update room status to LIVE
        const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: {
                status: "LIVE",
                launchedAt: now,
            },
        });

        // 2. Activate all boosts with trigger = ON_EVENT_START
        const onStartBoosts = await prisma.boost.findMany({
            where: { roomId, trigger: "ON_EVENT_START" },
        });

        let activatedCount = 0;
        for (const boost of onStartBoosts) {
            // Calculate endAt from durationMin if specified
            let endAt = boost.endAt;
            if (boost.durationMin && !endAt) {
                endAt = new Date(now.getTime() + boost.durationMin * 60 * 1000);
            }

            await prisma.boost.update({
                where: { id: boost.id },
                data: {
                    isActive: true,
                    activatedAt: now,
                    endAt,
                },
            });
            activatedCount++;
        }

        return NextResponse.json({
            room: updatedRoom,
            activatedBoosts: activatedCount,
            message: `Event launched! ${activatedCount} boost(s) activated automatically.`,
        });
    } catch (error) {
        console.error("Launch event error:", error);
        return NextResponse.json({ error: "Failed to launch event" }, { status: 500 });
    }
}
