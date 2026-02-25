import prisma from "@/lib/prisma";
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
        const now = new Date();
        const room = await prisma.room.update({
            where: { id: roomId },
            data: {
                status: 'CLOSED',
                closedAt: now,
            },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Close room error:", error);
        return NextResponse.json({ error: "Failed to close room" }, { status: 500 });
    }
}
