import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/utils";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;

    try {
        const { participantId, joinCode } = await request.json();

        if (!participantId || !joinCode) {
            return NextResponse.json({ error: "Participant ID and join code are required" }, { status: 400 });
        }

        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
        if (room.status !== "OPEN") return NextResponse.json({ error: "Room is not open" }, { status: 403 });
        if (room.joinCode !== joinCode) return NextResponse.json({ error: "Invalid join code" }, { status: 403 });

        const existing = await prisma.participant.findUnique({
            where: { id: participantId, roomId: roomId }
        });

        if (!existing) {
            return NextResponse.json({ error: "Participant not found" }, { status: 404 });
        }

        // Generate a NEW secret token. This invalidates the old token for the previous device.
        const token = uuidv4();
        const tokenHash = hashToken(token);

        // Update the participant with the new token hash
        await prisma.participant.update({
            where: { id: participantId },
            data: {
                tokenHash: tokenHash,
            },
        });

        return NextResponse.json({
            participantToken: token,
            displayName: existing.displayName,
            participantId: existing.id,
        });

    } catch (error) {
        console.error("Reconnect error:", error);
        return NextResponse.json({ error: "Failed to reconnect to room" }, { status: 500 });
    }
}
