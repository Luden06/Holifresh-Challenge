import db from "@/lib/db-sqlite";
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
        const now = new Date().toISOString();

        db.prepare(`
            UPDATE Claim 
            SET status = 'CANCELLED', cancelledAt = ?, cancelledBy = 'admin', cancelReason = ? 
            WHERE id = ?
        `).run(now, reason || "Admin cancellation", claimId);

        const claim = db.prepare("SELECT * FROM Claim WHERE id = ?").get(claimId);

        return NextResponse.json(claim);
    } catch (error) {
        console.error("Cancel claim error:", error);
        return NextResponse.json({ error: "Failed to cancel claim" }, { status: 500 });
    }
}
