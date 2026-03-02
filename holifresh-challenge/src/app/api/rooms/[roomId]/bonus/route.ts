import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/rooms/[roomId]/bonus
// Create a new direct bonus claim (type: "BONUS")
export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const body = await request.json();
        const { participantId, valueCents, reason } = body;

        // Validation
        if (!roomId || valueCents === undefined || !reason) {
            return NextResponse.json(
                { error: "Missing required fields (roomId, valueCents, or reason)" },
                { status: 400 }
            );
        }

        // Check if room exists
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { participants: true }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // If participantId is "ALL", create a bonus for everyone
        if (participantId === "ALL") {
            const claims = await prisma.$transaction(
                room.participants.map((participant) =>
                    prisma.claim.create({
                        data: {
                            roomId,
                            participantId: participant.id,
                            type: "BONUS",
                            valueCents: valueCents,
                            cancelReason: reason, // Store reason here
                            clientRequestId: `bonus-${Date.now()}-${participant.id}`, // Generate unique ID
                        }
                    })
                )
            );
            return NextResponse.json({ success: true, count: claims.length, message: "Collective bonus applied" }, { status: 201 });
        } else {
            // Individual bonus
            // Check if participant exists and is in the room
            const participant = room.participants.find(p => p.id === participantId);
            if (!participant) {
                return NextResponse.json({ error: "Participant not found in this room" }, { status: 404 });
            }

            const claim = await prisma.claim.create({
                data: {
                    roomId,
                    participantId,
                    type: "BONUS",
                    valueCents: valueCents,
                    cancelReason: reason, // Store reason here
                    clientRequestId: `bonus-${Date.now()}-${participantId}`, // Generate unique ID
                }
            });
            return NextResponse.json({ success: true, claim, message: "Individual bonus applied" }, { status: 201 });
        }

    } catch (error) {
        console.error("Error creating bonus:", error);
        return NextResponse.json(
            { error: "Failed to create bonus" },
            { status: 500 }
        );
    }
}
