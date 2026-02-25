import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string, claimId: string }> }
) {
    const { roomId, claimId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { reason } = await request.json().catch(() => ({ reason: "" }));
        const now = new Date();

        const claim = await prisma.claim.update({
            where: { id: claimId },
            data: {
                status: 'CANCELLED',
                cancelledAt: now,
                cancelledBy: 'admin',
                cancelReason: reason || "Admin cancellation",
            },
        });

        return NextResponse.json(claim);
    } catch (error) {
        console.error("Cancel claim error:", error);
        return NextResponse.json({ error: "Failed to cancel claim" }, { status: 500 });
    }
}
