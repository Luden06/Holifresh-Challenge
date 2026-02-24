import db from "@/lib/db-sqlite";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;

    try {
        const room = db.prepare("SELECT * FROM Room WHERE id = ?").get(roomId) as any;

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const totalsRow = db.prepare("SELECT COUNT(*) as count FROM Claim WHERE roomId = ? AND status = 'VALID'").get(roomId) as any;
        const totals = totalsRow?.count || 0;

        // Get leaderboard
        const leaderboard = db.prepare(`
            SELECT 
                p.id, 
                p.displayName, 
                (SELECT COUNT(*) FROM Claim c WHERE c.participantId = p.id AND c.status = 'VALID') as score
            FROM Participant p
            WHERE p.roomId = ?
            ORDER BY score DESC
            LIMIT 10
        `).all(roomId) as any[];

        const formattedLeaderboard = leaderboard.map((p: any) => ({
            id: p.id,
            displayName: p.displayName,
            score: p.score,
            businessCents: p.score * room.rdvValueCents,
        }));

        return NextResponse.json({
            roomName: room.name,
            status: room.status,
            totals,
            businessTotalCents: totals * room.rdvValueCents,
            objectiveTotal: room.objectiveTotal,
            objectiveProgress: room.objectiveTotal > 0 ? (totals / room.objectiveTotal) * 100 : 0,
            leaderboard: formattedLeaderboard,
            signaturesGoal: room.signaturesGoal,
            rdvValueCents: room.rdvValueCents,
            lastEventAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Summary API error:", error);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}
