import { getComments, addComment } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
        return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const comments = await getComments(questionId);

    return NextResponse.json(comments);
}

export async function POST(request: Request) {
    try {
        const { questionId, content, author } = await request.json();

        if (!questionId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const comment = await addComment(questionId, content, author || "Guest");

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
