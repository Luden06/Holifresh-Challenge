import db from "@/lib/db-sqlite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const claims = db.prepare(`
            SELECT c.*, p.displayName as participantName, p.id as participantId
            FROM Claim c
            JOIN Participant p ON c.participantId = p.id
            WHERE c.roomId = ?
            ORDER BY c.createdAt DESC
            LIMIT 100
        `).all(roomId) as any[];

        // Format to match old structure if needed
        const formattedClaims = claims.map(c => ({
            ...c,
            participant: {
                id: c.participantId,
                displayName: c.participantName
            }
        }));

        return NextResponse.json(formattedClaims);
    } catch (error) {
        console.error("Fetch events error:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
