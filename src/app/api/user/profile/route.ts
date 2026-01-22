import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const profile = await request.json();

        if (!profile.uid) {
            return NextResponse.json({ error: "UID is required" }, { status: 400 });
        }

        const docRef = db.collection("users").doc(profile.uid);
        await docRef.set({
            ...profile,
            updatedAt: new Date()
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Error (updateUserProfile):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");

        if (!uid) {
            return NextResponse.json({ error: "UID is required" }, { status: 400 });
        }

        const docSnap = await db.collection("users").doc(uid).get();
        if (!docSnap.exists) {
            return NextResponse.json({ data: null });
        }

        const data = docSnap.data();
        return NextResponse.json({
            data: {
                ...data,
                updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data?.updatedAt
            }
        });
    } catch (error: any) {
        console.error("API Error (getUserProfile):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
