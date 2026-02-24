import db from "@/lib/db-sqlite";
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
        const { displayName, joinCode } = await request.json();

        if (!displayName || !joinCode) {
            return NextResponse.json({ error: "Display name and join code are required" }, { status: 400 });
        }

        const room = db.prepare("SELECT * FROM Room WHERE id = ?").get(roomId) as any;

        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
        if (room.status !== "OPEN") return NextResponse.json({ error: "Room is not open" }, { status: 403 });
        if (room.joinCode !== joinCode) return NextResponse.json({ error: "Invalid join code" }, { status: 403 });

        // Normalize name for collision strategy
        let name = displayName.trim();
        let nameKey = name.toLowerCase().replace(/\s+/g, "");
        let finalName = name;
        let finalNameKey = nameKey;
        let counter = 1;

        // Check for collisions and auto-suffix
        while (true) {
            const existing = db.prepare("SELECT id FROM Participant WHERE roomId = ? AND displayNameKey = ?")
                .get(roomId, finalNameKey);

            if (!existing) break;

            counter++;
            finalName = `${name} (${counter})`;
            finalNameKey = `${nameKey}${counter}`;
        }

        // Generate secret token
        const token = uuidv4();
        const tokenHash = hashToken(token);
        const participantId = uuidv4();

        const stmt = db.prepare(`
            INSERT INTO Participant (id, roomId, displayName, displayNameKey, tokenHash)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(participantId, roomId, finalName, finalNameKey, tokenHash);

        return NextResponse.json({
            participantToken: token,
            displayName: finalName,
            participantId: participantId,
        });
    } catch (error) {
        console.error("Join error:", error);
        return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
    }
}
