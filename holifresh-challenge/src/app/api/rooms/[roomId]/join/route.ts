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
        const { displayName, joinCode, forceNew } = await request.json();

        if (!displayName || !joinCode) {
            return NextResponse.json({ error: "Display name and join code are required" }, { status: 400 });
        }

        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
        if (room.status !== "OPEN") return NextResponse.json({ error: "Room is not open" }, { status: 403 });
        if (room.joinCode !== joinCode) return NextResponse.json({ error: "Invalid join code" }, { status: 403 });

        // Normalize name for collision strategy
        let name = displayName.trim();
        let nameKey = name.toLowerCase().replace(/\s+/g, "");
        let finalName = name;
        let finalNameKey = nameKey;
        let counter = 1;

        // Check for collisions
        const existing = await prisma.participant.findUnique({
            where: {
                roomId_displayNameKey: {
                    roomId: roomId,
                    displayNameKey: finalNameKey,
                },
            },
        });

        if (existing && !forceNew) {
            // Option 3D: Return a 409 to prompt the user for takeover
            const claimsCount = await prisma.claim.count({
                where: { participantId: existing.id, status: "VALID", type: "RDV" }
            });

            return NextResponse.json({
                error: "Participant already exists",
                requiresConfirmation: true,
                existingParticipant: {
                    id: existing.id,
                    displayName: existing.displayName,
                    points: claimsCount
                }
            }, { status: 409 });
        }

        // Auto-suffix mode (if forceNew is true or if we are actively finding a free suffix)
        if (existing) {
            while (true) {
                const check = await prisma.participant.findUnique({
                    where: {
                        roomId_displayNameKey: {
                            roomId: roomId,
                            displayNameKey: finalNameKey,
                        },
                    },
                });

                if (!check) break;

                counter++;
                finalName = `${name} (${counter})`;
                finalNameKey = `${nameKey}${counter}`;
            }
        }

        // Generate secret token
        const token = uuidv4();
        const tokenHash = hashToken(token);
        const participantId = uuidv4();

        await prisma.participant.create({
            data: {
                id: participantId,
                roomId: roomId,
                displayName: finalName,
                displayNameKey: finalNameKey,
                tokenHash: tokenHash,
            },
        });

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
