import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Only allow updating specific fields
        const allowedFields: Record<string, any> = {};
        if (body.name !== undefined) allowedFields.name = body.name;
        if (body.objectiveTotal !== undefined) allowedFields.objectiveTotal = parseInt(body.objectiveTotal) || 0;
        if (body.rdvValueCents !== undefined) allowedFields.rdvValueCents = parseInt(body.rdvValueCents) || 0;
        if (body.signaturesGoal !== undefined) allowedFields.signaturesGoal = parseInt(body.signaturesGoal) || 0;
        if (body.joinCode !== undefined) allowedFields.joinCode = body.joinCode;
        if (body.status !== undefined) allowedFields.status = body.status;

        if (Object.keys(allowedFields).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const room = await prisma.room.update({
            where: { id: roomId },
            data: allowedFields,
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Update room error:", error);
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await params;
    const cookieStore = await cookies();

    if (cookieStore.get("admin_session")?.value !== "true") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Archive = set status to ARCHIVED
        const room = await prisma.room.update({
            where: { id: roomId },
            data: { status: "ARCHIVED" },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Archive room error:", error);
        return NextResponse.json({ error: "Failed to archive room" }, { status: 500 });
    }
}
