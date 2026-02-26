import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SELF_CANCEL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string, claimId: string }> }
) {
    const { roomId, claimId } = await params;

    try {
        const body = await request.json().catch(() => ({}));
        const { reason, participantToken } = body;

        const cookieStore = await cookies();
        const isAdmin = cookieStore.get("admin_session")?.value === "true";

        // Determine who is cancelling
        let cancelledBy: string;

        if (isAdmin) {
            cancelledBy = "admin";
        } else if (participantToken) {
            // Self-cancel: verify the participant owns this claim
            const tokenHash = hashToken(participantToken);
            const participant = await prisma.participant.findUnique({
                where: { tokenHash },
            });

            if (!participant) {
                return NextResponse.json({ error: "Invalid token" }, { status: 401 });
            }

            // Verify the claim belongs to this participant
            const claim = await prisma.claim.findUnique({
                where: { id: claimId },
            });

            if (!claim || claim.participantId !== participant.id || claim.roomId !== roomId) {
                return NextResponse.json({ error: "Claim not found or not yours" }, { status: 403 });
            }

            if (claim.status !== "VALID") {
                return NextResponse.json({ error: "Claim already cancelled" }, { status: 400 });
            }

            // Check 10-min window
            const elapsed = Date.now() - new Date(claim.createdAt).getTime();
            if (elapsed > SELF_CANCEL_WINDOW_MS) {
                return NextResponse.json({ error: "Self-cancel window expired (10 min). Contact admin." }, { status: 403 });
            }

            cancelledBy = "self";
        } else {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        const updated = await prisma.claim.update({
            where: { id: claimId },
            data: {
                status: 'CANCELLED',
                cancelledAt: now,
                cancelledBy,
                cancelReason: reason || (cancelledBy === "self" ? "Auto-correction" : "Admin cancellation"),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Cancel claim error:", error);
        return NextResponse.json({ error: "Failed to cancel claim" }, { status: 500 });
    }
}
