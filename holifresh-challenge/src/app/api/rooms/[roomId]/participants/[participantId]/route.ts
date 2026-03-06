import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ roomId: string; participantId: string }> }
) {
    try {
        const { roomId, participantId } = await params;

        // Verify room
        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Delete participant
        // Prisma's `onDelete: Cascade` will automatically delete associated claims
        await prisma.participant.delete({
            where: { id: participantId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete participant error:", error);
        return NextResponse.json({ error: "Failed to delete participant" }, { status: 500 });
    }
}
