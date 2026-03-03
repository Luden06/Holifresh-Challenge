import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/utils";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const COOLDOWN_MS = 3000;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;

    try {
        const { participantToken, clientRequestId } = await request.json();

        if (!participantToken || !clientRequestId) {
            return NextResponse.json({ error: "Token and request ID are required" }, { status: 400 });
        }

        // 1. Authenticate participant
        const tokenHash = hashToken(participantToken);
        const participant = await prisma.participant.findUnique({
            where: { tokenHash },
        });

        if (!participant || participant.roomId !== roomId) {
            return NextResponse.json({ error: "Invalid participant token" }, { status: 401 });
        }

        // 2. Check room status
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            select: { status: true },
        });

        if (!room || room.status !== "LIVE") {
            return NextResponse.json({ error: "L'événement n'est pas encore lancé" }, { status: 403 });
        }

        // 3. Idempotency Check (clientRequestId)
        const existingClaim = await prisma.claim.findUnique({
            where: { clientRequestId },
        });
        if (existingClaim) {
            return NextResponse.json({ success: true, duplicated: true });
        }

        // 4. Anti Double Tap (3s cooldown)
        const now = new Date();
        if (participant.lastClaimAt) {
            const lastClaim = new Date(participant.lastClaimAt);
            const diff = now.getTime() - lastClaim.getTime();
            if (diff < COOLDOWN_MS) {
                return NextResponse.json({ error: "Slow down! Wait 3 seconds." }, { status: 429 });
            }
        }

        // 5. Detect active boosts
        const activeBoosts: any[] = await prisma.boost.findMany({
            where: {
                roomId,
                isActive: true,
            },
        });

        // Filter by schedule window
        const effectiveBoosts = activeBoosts.filter((b) => {
            if (b.startAt && now < b.startAt) return false;
            if (b.endAt && now > b.endAt) return false;
            return true;
        });

        // 6. Create Claim, ClaimBoosts, and Update Participant in a Transaction
        const claimId = uuidv4();

        const transactionOps: any[] = [
            prisma.claim.create({
                data: {
                    id: claimId,
                    roomId,
                    participantId: participant.id,
                    clientRequestId,
                    type: "RDV", // explicitly setting type to RDV for clarity
                    status: 'VALID',
                    createdAt: now,
                },
            }),
            prisma.participant.update({
                where: { id: participant.id },
                data: { lastClaimAt: now },
            }),
        ];

        // Add ClaimBoost entries for MULTIPLIER or FLAT_BONUS active boosts
        const regularBoosts = effectiveBoosts.filter(b => b.type !== "PALIER");
        for (const boost of regularBoosts) {
            transactionOps.push(
                prisma.claimBoost.create({
                    data: {
                        claimId,
                        boostId: boost.id,
                    },
                })
            );
        }

        // Handle PALIER Boosts
        const palierBoosts = effectiveBoosts.filter(b => b.type === "PALIER" && b.palierTarget && b.palierScope && b.bonusCents);
        const triggeredPaliers: { label: string; bonusCents: number; scope: string }[] = [];
        if (palierBoosts.length > 0) {
            // Count existing valid RDV claims to check if we hit the milestone exactly
            const userRdvCount = await prisma.claim.count({
                where: { roomId, participantId: participant.id, type: "RDV", status: "VALID" }
            });
            const teamRdvCount = await prisma.claim.count({
                where: { roomId, type: "RDV", status: "VALID" }
            });

            // New counts including this new RDV being inserted
            const newUserCount = userRdvCount + 1;
            const newTeamCount = teamRdvCount + 1;

            for (const boost of palierBoosts) {
                if (boost.palierScope === "INDIVIDUAL" && newUserCount === boost.palierTarget) {
                    triggeredPaliers.push({ label: boost.label, bonusCents: boost.bonusCents, scope: "INDIVIDUAL" });
                    // Trigger individual bonus
                    transactionOps.push(
                        prisma.claim.create({
                            data: {
                                id: uuidv4(),
                                roomId,
                                participantId: participant.id,
                                type: "BONUS",
                                status: "VALID",
                                valueCents: boost.bonusCents,
                                cancelReason: `Palier Individuel : ${boost.label}`,
                                clientRequestId: `bonus-${uuidv4()}`,
                                createdAt: new Date(now.getTime() + 100) // slight offset
                            }
                        })
                    );
                } else if (boost.palierScope === "TEAM" && newTeamCount === boost.palierTarget) {
                    triggeredPaliers.push({ label: boost.label, bonusCents: boost.bonusCents, scope: "TEAM" });
                    // Trigger team bonus for ALL participants in the room
                    const allParticipants = await prisma.participant.findMany({
                        where: { roomId },
                        select: { id: true }
                    });
                    for (const p of allParticipants) {
                        transactionOps.push(
                            prisma.claim.create({
                                data: {
                                    id: uuidv4(),
                                    roomId,
                                    participantId: p.id,
                                    type: "BONUS",
                                    status: "VALID",
                                    valueCents: boost.bonusCents,
                                    cancelReason: `Palier Équipe : ${boost.label}`,
                                    clientRequestId: `bonus-${uuidv4()}`,
                                    createdAt: new Date(now.getTime() + 100)
                                }
                            })
                        );
                    }
                }
            }
        }

        await prisma.$transaction(transactionOps);

        // Calculate time since last claim for rapid-declaration detection
        const timeSinceLastClaim = participant.lastClaimAt
            ? now.getTime() - new Date(participant.lastClaimAt).getTime()
            : null;

        // Only return non-PALIER boosts as "applied" (i.e. per-claim modifiers)
        const regularApplied = effectiveBoosts.filter(b => b.type !== "PALIER");

        return NextResponse.json({
            success: true,
            claimId,
            timeSinceLastClaim,
            appliedBoosts: regularApplied.map((b) => ({
                id: b.id,
                label: b.label,
                type: b.type,
                multiplier: b.multiplier,
                bonusCents: b.bonusCents,
            })),
            triggeredPaliers,
        });
    } catch (error) {
        console.error("Claim error:", error);
        return NextResponse.json({ error: "Failed to record claim" }, { status: 500 });
    }
}

