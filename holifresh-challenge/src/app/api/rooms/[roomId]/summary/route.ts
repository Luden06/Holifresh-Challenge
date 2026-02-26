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
                        _count: {
                            select: {
                                claims: {
                                    where: { status: 'VALID' }
                                }
                            }
                        }
                    },
                    orderBy: {
                        claims: {
                            _count: 'desc'
                        }
                    },
                    take: 10
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const totals = room._count.claims;

        const formattedLeaderboard = room.participants.map((p: any) => ({
            id: p.id,
            displayName: p.displayName,
            score: p._count.claims,
            businessCents: p._count.claims * room.rdvValueCents,
        }));

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
                    cancelReason: true,
                    cancelledBy: true,
                },
            });
        }

        return NextResponse.json({
            roomName: room.name,
            status: room.status,
            totals,
            businessTotalCents: totals * room.rdvValueCents,
            objectiveTotal: room.objectiveTotal,
            objectiveProgress: room.objectiveTotal > 0 ? (totals / room.objectiveTotal) * 100 : 0,
            leaderboard: formattedLeaderboard,
            signaturesGoal: room.signaturesGoal,
            rdvValueCents: room.rdvValueCents,
            lastEventAt: new Date().toISOString(),
            myClaims,
        });
    } catch (error) {
        console.error("Summary API error:", error);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}
