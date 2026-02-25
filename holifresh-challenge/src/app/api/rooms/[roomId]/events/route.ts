import prisma from "@/lib/prisma";
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
        const claims = await prisma.claim.findMany({
            where: { roomId: roomId },
            include: {
                participant: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100,
        });

        return NextResponse.json(claims);
    } catch (error) {
        console.error("Fetch events error:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
