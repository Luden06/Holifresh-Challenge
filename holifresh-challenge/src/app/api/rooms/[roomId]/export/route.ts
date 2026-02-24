import db from "@/lib/db-sqlite";
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
        const room = db.prepare("SELECT * FROM Room WHERE id = ?").get(roomId) as any;
        if (!room) return new Response("Room not found", { status: 404 });

        const claims = db.prepare(`
            SELECT c.*, p.displayName as participantName
            FROM Claim c
            JOIN Participant p ON c.participantId = p.id
            WHERE c.roomId = ?
            ORDER BY c.createdAt DESC
        `).all(roomId) as any[];

        // CSV Headers
        const headers = [
            "claim_id",
            "created_at",
            "status",
            "participant_id",
            "display_name",
            "cancelled_at",
            "cancelled_by",
            "cancel_reason",
            "room_id",
            "rdv_value_cents",
            "computed_business_cents",
        ];

        const rows = claims.map((claim: any) => {
            const business = claim.status === "VALID" ? room.rdvValueCents : 0;
            return [
                claim.id,
                claim.createdAt, // Already a string ISO
                claim.status,
                claim.participantId,
                claim.participantName,
                claim.cancelledAt || "",
                claim.cancelledBy || "",
                claim.cancelReason || "",
                claim.roomId,
                room.rdvValueCents,
                business,
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((row: any) => row.map((val: any) => `"${val}"`).join(",")),
        ].join("\n");

        return new Response(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename=claims-log-${roomId}.csv`,
            },
        });
    } catch (error) {
        console.error("CSV Export error:", error);
        return new Response("Failed to export CSV", { status: 500 });
    }
}
