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
        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) return new Response("Room not found", { status: 404 });

        const claims = await prisma.claim.findMany({
            where: { roomId: roomId },
            include: {
                participant: {
                    select: {
                        displayName: true,
                    },
                },
                claimBoosts: {
                    select: {
                        boost: {
                            select: {
                                label: true,
                                type: true,
                                multiplier: true,
                                bonusCents: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // CSV Headers
        const headers = [
            "claim_id",
            "created_at",
            "status",
            "type",              // RDV or BONUS
            "participant_id",
            "display_name",
            "cancelled_at",
            "cancelled_by",
            "cancel_reason",
            "room_id",
            "rdv_value_cents",
            "computed_business_cents",
            "cagnotte_earned_cents", // New: How much cagnotte was earned for this line
            "applied_boosts_info",   // New: Labels of boosts/bonus applied
        ];

        const rows = claims.map((claim: any) => {
            const isCancelled = claim.status === "CANCELLED";
            let business = 0;
            let cagnotteEarned = 0;
            let boostInfo = "";

            if (!isCancelled) {
                if (claim.type === "BONUS") {
                    business = 0; // Bonus doesn't generate business CA
                    cagnotteEarned = claim.valueCents || 0;
                    boostInfo = "Bonus Direct";
                } else {
                    // Normal RDV
                    business = room.rdvValueCents;
                    cagnotteEarned = room.cagnotteValueCents;

                    const appliedBoosts = claim.claimBoosts?.map((cb: any) => cb.boost) || [];
                    if (appliedBoosts.length > 0) {
                        const labels = [];
                        for (const b of appliedBoosts) {
                            if (b.type === "MULTIPLIER" && b.multiplier) {
                                cagnotteEarned = Math.round(cagnotteEarned * b.multiplier);
                                labels.push(`${b.label} (x${b.multiplier})`);
                            } else if (b.type === "FLAT_BONUS" && b.bonusCents) {
                                cagnotteEarned += b.bonusCents;
                                labels.push(`${b.label} (+${b.bonusCents / 100}€)`);
                            }
                        }
                        boostInfo = labels.join(" | ");
                    }
                }
            }

            return [
                claim.id,
                claim.createdAt.toISOString(),
                claim.status,
                claim.type || "RDV",
                claim.participantId,
                claim.participant.displayName,
                claim.cancelledAt?.toISOString() || "",
                claim.cancelledBy || "",
                claim.cancelReason || "",
                claim.roomId,
                room.rdvValueCents,
                business,
                cagnotteEarned,
                boostInfo,
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
