import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// PATCH /api/rooms/[roomId]/boosts/[boostId] — update a boost (toggle, reschedule, etc.)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ roomId: string; boostId: string }> }
) {
    const { roomId, boostId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const allowedFields: Record<string, any> = {};
        if (body.label !== undefined) allowedFields.label = body.label;
        if (body.description !== undefined) allowedFields.description = body.description || null;
        if (body.type !== undefined) allowedFields.type = body.type;
        if (body.multiplier !== undefined) allowedFields.multiplier = body.multiplier !== null ? parseFloat(body.multiplier) : null;
        if (body.bonusCents !== undefined) allowedFields.bonusCents = body.bonusCents !== null ? parseInt(body.bonusCents) : null;
        if (body.trigger !== undefined) allowedFields.trigger = body.trigger || null;
        if (body.durationMin !== undefined) allowedFields.durationMin = body.durationMin ? parseInt(body.durationMin) : null;
        if (body.startAt !== undefined) allowedFields.startAt = body.startAt ? new Date(body.startAt) : null;
        if (body.endAt !== undefined) allowedFields.endAt = body.endAt ? new Date(body.endAt) : null;

        if (body.isActive !== undefined) {
            allowedFields.isActive = body.isActive;
            // Set activatedAt when toggling on, clear when toggling off
            if (body.isActive) {
                allowedFields.activatedAt = new Date();
            } else {
                allowedFields.activatedAt = null;
            }
        }

        if (Object.keys(allowedFields).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const boost = await prisma.boost.update({
            where: { id: boostId, roomId },
            data: allowedFields,
        });

        const now = new Date();
        let effectivelyActive = boost.isActive &&
            (!boost.startAt || now >= boost.startAt) &&
            (!boost.endAt || now <= boost.endAt);

        // Check duration-based expiration
        if (effectivelyActive && boost.durationMin && boost.activatedAt) {
            const expiresAt = new Date(boost.activatedAt.getTime() + boost.durationMin * 60 * 1000);
            if (now > expiresAt) effectivelyActive = false;
        }

        const expiresAt = boost.endAt ? boost.endAt :
            (boost.durationMin && boost.activatedAt ? new Date(boost.activatedAt.getTime() + boost.durationMin * 60 * 1000) : null);

        return NextResponse.json({ ...boost, effectivelyActive, expiresAt });
    } catch (error) {
        console.error("Update boost error:", error);
        return NextResponse.json({ error: "Failed to update boost" }, { status: 500 });
    }
}

// DELETE /api/rooms/[roomId]/boosts/[boostId] — delete a boost
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ roomId: string; boostId: string }> }
) {
    const { roomId, boostId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.boost.delete({
            where: { id: boostId, roomId },
        });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Delete boost error:", error);
        return NextResponse.json({ error: "Failed to delete boost" }, { status: 500 });
    }
}
