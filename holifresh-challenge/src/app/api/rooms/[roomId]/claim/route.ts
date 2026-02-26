import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/utils";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const COOLDOWN_MS = 3000;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;

    try {
        const { participantToken, clientRequestId } = await request.json();

        if (!participantToken || !clientRequestId) {
            return NextResponse.json({ error: "Token and request ID are required" }, { status: 400 });
        }

        // 1. Authenticate participant
        const tokenHash = hashToken(participantToken);
        const participant = await prisma.participant.findUnique({
            where: { tokenHash },
        });

        if (!participant || participant.roomId !== roomId) {
            return NextResponse.json({ error: "Invalid participant token" }, { status: 401 });
        }

        // 2. Check room status
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            select: { status: true },
        });

        if (!room || room.status !== "OPEN") {
            return NextResponse.json({ error: "Room is not open" }, { status: 403 });
        }

        // 3. Idempotency Check (clientRequestId)
        const existingClaim = await prisma.claim.findUnique({
            where: { clientRequestId },
        });
        if (existingClaim) {
            return NextResponse.json({ success: true, duplicated: true });
        }

        // 4. Anti Double Tap (3s cooldown)
        const now = new Date();
        if (participant.lastClaimAt) {
            const lastClaim = new Date(participant.lastClaimAt);
            const diff = now.getTime() - lastClaim.getTime();
            if (diff < COOLDOWN_MS) {
                return NextResponse.json({ error: "Slow down! Wait 3 seconds." }, { status: 429 });
            }
        }

        // 5. Create Claim and Update Participant in a Transaction
        const claimId = uuidv4();

        await prisma.$transaction([
            prisma.claim.create({
                data: {
                    id: claimId,
                    roomId,
                    participantId: participant.id,
                    clientRequestId,
                    status: 'VALID',
                    createdAt: now,
                },
            }),
            prisma.participant.update({
                where: { id: participant.id },
                data: { lastClaimAt: now },
            }),
        ]);

        // Calculate time since last claim for rapid-declaration detection
        const timeSinceLastClaim = participant.lastClaimAt
            ? now.getTime() - new Date(participant.lastClaimAt).getTime()
            : null;

        return NextResponse.json({ success: true, claimId, timeSinceLastClaim });
    } catch (error) {
        console.error("Claim error:", error);
        return NextResponse.json({ error: "Failed to record claim" }, { status: 500 });
    }
}
