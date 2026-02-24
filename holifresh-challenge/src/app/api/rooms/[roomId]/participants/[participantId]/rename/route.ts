import db from "@/lib/db-sqlite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string, participantId: string }> }
) {
    const { roomId, participantId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { displayName } = await request.json();

        if (!displayName) {
            return NextResponse.json({ error: "Display name is required" }, { status: 400 });
        }

        db.prepare(`
            UPDATE Participant SET displayName = ? WHERE id = ?
        `).run(displayName, participantId);

        const participant = db.prepare("SELECT * FROM Participant WHERE id = ?").get(participantId);

        return NextResponse.json(participant);
    } catch (error) {
        console.error("Rename participant error:", error);
        return NextResponse.json({ error: "Failed to rename participant" }, { status: 500 });
    }
}
