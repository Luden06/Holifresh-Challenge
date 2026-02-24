import db from "@/lib/db-sqlite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
        const now = new Date().toISOString();
        db.prepare(`
            UPDATE Room SET status = 'CLOSED', closedAt = ? WHERE id = ?
        `).run(now, roomId);

        const room = db.prepare("SELECT * FROM Room WHERE id = ?").get(roomId);

        return NextResponse.json(room);
    } catch (error) {
        console.error("Close room error:", error);
        return NextResponse.json({ error: "Failed to close room" }, { status: 500 });
    }
}
