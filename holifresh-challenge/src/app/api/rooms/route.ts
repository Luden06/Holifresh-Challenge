import db from "@/lib/db-sqlite";
import { generateRoomId } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

        const stmt = db.prepare(`
            INSERT INTO Room (id, name, joinCode, objectiveTotal, rdvValueCents, signaturesGoal)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            roomCode,
            name,
            joinCode,
            parseInt(objectiveTotal) || 0,
            parseInt(rdvValueCents) || 0,
            parseInt(signaturesGoal) || 0
        );

        // Fetch the created room to return it
        const room = db.prepare("SELECT * FROM Room WHERE id = ?").get(roomCode);

        return NextResponse.json(room);
    } catch (error) {
        console.error("Room creation error:", error);
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}
