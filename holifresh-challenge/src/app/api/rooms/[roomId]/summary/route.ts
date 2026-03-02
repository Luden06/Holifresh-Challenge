import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;

    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                _count: {
                    select: {
                        claims: {
                            where: { status: 'VALID' }
                        }
                    }
                },
                participants: {
                    select: {
                        id: true,
                        displayName: true,
                        claims: {
                            where: { status: 'VALID' },
                            select: {
                                id: true,
                                type: true,
                                valueCents: true,
                                claimBoosts: {
                                    select: {
                                        boost: {
                                            select: {
                                                type: true,
                                                multiplier: true,
                                                bonusCents: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
                boosts: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        label: true,
                        type: true,
                        multiplier: true,
                        bonusCents: true,
                        isActive: true,
                        startAt: true,
                        endAt: true,
                    }
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const now = new Date();
        const totals = room._count.claims; // Temporarily keep this (it might include bonuses, we will adjust it)

        // Filter effectively active boosts (isActive + within schedule window)
        const activeBoosts = room.boosts.filter((b) => {
            if (b.startAt && now < b.startAt) return false;
            if (b.endAt && now > b.endAt) return false;
            return true;
        });

        // Calculate cagnotte for each participant
        const baseCagnotte = room.cagnotteValueCents;
        let trueRdvTotals = 0;

        const formattedLeaderboard = room.participants
            .map((p) => {
                const validClaims = p.claims;
                let score = 0;
                let cagnotteCents = 0;

                for (const claim of validClaims) {
                    if (claim.type === 'BONUS') {
                        // Bonus Direct: Just add the value to cagnotte, no RDV score
                        if (claim.valueCents) {
                            cagnotteCents += claim.valueCents;
                        }
                    } else {
                        // Regular RDV (type === 'RDV')
                        score++;
                        trueRdvTotals++;

                        let claimCagnotte = baseCagnotte;
                        for (const cb of claim.claimBoosts) {
                            if (cb.boost.type === 'MULTIPLIER' && cb.boost.multiplier) {
                                claimCagnotte = Math.round(claimCagnotte * cb.boost.multiplier);
                            } else if (cb.boost.type === 'FLAT_BONUS' && cb.boost.bonusCents) {
                                claimCagnotte += cb.boost.bonusCents;
                            }
                        }
                        cagnotteCents += claimCagnotte;
                    }
                }

                return {
                    id: p.id,
                    displayName: p.displayName,
                    score,
                    businessCents: score * room.rdvValueCents,
                    cagnotteCents,
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const teamCagnotteCents = formattedLeaderboard.reduce((sum, p) => sum + p.cagnotteCents, 0);

        // Optionally fetch participant's own claims for "Mes RDV" section
        const { searchParams } = new URL(request.url);
        const participantId = searchParams.get("participantId");
        let myClaims: any[] = [];

        if (participantId) {
            myClaims = await prisma.claim.findMany({
                where: { roomId, participantId },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    createdAt: true,
                    status: true,
                    type: true,
                    valueCents: true,
                    cancelReason: true,
                    cancelledBy: true,
                    claimBoosts: {
                        select: {
                            boost: {
                                select: {
                                    label: true,
                                    type: true,
                                    multiplier: true,
                                    bonusCents: true,
                                }
                            }
                        }
                    }
                },
            });
        }

        return NextResponse.json({
            roomName: room.name,
            status: room.status,
            totals: trueRdvTotals,
            businessTotalCents: trueRdvTotals * room.rdvValueCents,
            objectiveTotal: room.objectiveTotal,
            objectiveProgress: room.objectiveTotal > 0 ? (trueRdvTotals / room.objectiveTotal) * 100 : 0,
            leaderboard: formattedLeaderboard,
            signaturesGoal: room.signaturesGoal,
            rdvValueCents: room.rdvValueCents,
            cagnotteValueCents: room.cagnotteValueCents,
            teamCagnotteCents,
            activeBoosts,
            lastEventAt: new Date().toISOString(),
            myClaims,
        });
    } catch (error) {
        console.error("Summary API error:", error);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}

