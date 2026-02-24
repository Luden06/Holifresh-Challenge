import db from "@/lib/db-sqlite";
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
        const participant = db.prepare("SELECT * FROM Participant WHERE tokenHash = ?").get(tokenHash) as any;

        if (!participant || participant.roomId !== roomId) {
            return NextResponse.json({ error: "Invalid participant token" }, { status: 401 });
        }

        // 2. Check room status
        const room = db.prepare("SELECT status FROM Room WHERE id = ?").get(roomId) as any;
        if (!room || room.status !== "OPEN") {
            return NextResponse.json({ error: "Room is not open" }, { status: 403 });
        }

        // 3. Idempotency Check (clientRequestId)
        const existingClaim = db.prepare("SELECT id FROM Claim WHERE clientRequestId = ?").get(clientRequestId);
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
        const nowStr = now.toISOString();

        const transaction = db.transaction(() => {
            db.prepare(`
                INSERT INTO Claim (id, roomId, participantId, clientRequestId, status, createdAt)
                VALUES (?, ?, ?, ?, 'VALID', ?)
            `).run(claimId, roomId, participant.id, clientRequestId, nowStr);

            db.prepare(`
                UPDATE Participant SET lastClaimAt = ? WHERE id = ?
            `).run(nowStr, participant.id);
        });

        transaction();

        return NextResponse.json({ success: true, claimId });
    } catch (error) {
        console.error("Claim error:", error);
        return NextResponse.json({ error: "Failed to record claim" }, { status: 500 });
    }
}
