import prisma from "@/lib/prisma";
import { generateRoomId } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const cookieStore = await cookies();
    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const rooms = await prisma.room.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(rooms);
    } catch (error) {
        console.error("List rooms error:", error);
        return NextResponse.json({ error: "Failed to list rooms" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Simple admin check
    const cookieStore = await cookies();
    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, objectiveTotal, rdvValueCents, joinCode, signaturesGoal } = await request.json();

        if (!name || !joinCode) {
            return NextResponse.json({ error: "Name and joinCode are required" }, { status: 400 });
        }

        const roomCode = generateRoomId();

        const room = await prisma.room.create({
            data: {
                id: roomCode,
                name,
                joinCode,
                objectiveTotal: parseInt(objectiveTotal) || 0,
                rdvValueCents: parseInt(rdvValueCents) || 0,
                signaturesGoal: parseInt(signaturesGoal) || 0,
            },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Room creation error:", error);
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}
