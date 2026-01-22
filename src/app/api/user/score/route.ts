import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const scoreData = await request.json();

        if (!scoreData.userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        await db.collection("userScores").add({
            ...scoreData,
            createdAt: new Date()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Error (saveUserScore):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const snapshot = await db.collection("userScores")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        const history = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
            };
        });

        return NextResponse.json({ data: history });
    } catch (error: any) {
        console.error("API Error (getUserScoreHistory):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
