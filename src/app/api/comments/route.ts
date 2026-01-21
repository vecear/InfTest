import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
        return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
        where: { questionId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
}

export async function POST(request: Request) {
    try {
        const { questionId, content } = await request.json();

        if (!questionId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                questionId,
                content,
                author: "Guest", // Defaulting to Guest for now
            },
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
